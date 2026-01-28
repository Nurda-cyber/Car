const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Car = require('../models/Car');
const User = require('../models/User');
const admin = require('../middleware/admin');
const { getCityCoordinates } = require('../utils/calculateDistance');

const router = express.Router();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/cars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'car-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Добавить новый автомобиль
router.post('/cars', admin, upload.array('photos', 10), async (req, res) => {
  try {
    const {
      brand,
      model,
      year,
      price,
      mileage,
      color,
      engine,
      transmission,
      fuelType,
      description,
      status,
      city
    } = req.body;

    // Валидация обязательных полей
    if (!brand || !model || !year || !price) {
      return res.status(400).json({ message: 'Заполните все обязательные поля' });
    }

    // Обработка загруженных фото
    const photos = req.files ? req.files.map(file => `/uploads/cars/${file.filename}`) : [];

    // Получаем координаты города, если указан
    let latitude = null;
    let longitude = null;
    if (city) {
      const coords = getCityCoordinates(city);
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lon;
      }
    }

    const car = await Car.create({
      brand,
      model,
      year: parseInt(year),
      price: parseFloat(price),
      mileage: mileage ? parseInt(mileage) : 0,
      color: color || null,
      engine: engine || null,
      transmission: transmission || null,
      fuelType: fuelType || null,
      description: description || null,
      photos,
      status: status || 'pending',
      isActive: true,
      city: city || null,
      latitude: latitude,
      longitude: longitude,
      location: city || null
    });

    res.status(201).json({ message: 'Автомобиль успешно добавлен', car });
  } catch (error) {
    console.error('Ошибка добавления автомобиля:', error);
    res.status(500).json({ message: 'Ошибка сервера при добавлении автомобиля' });
  }
});

// Обновить автомобиль (обработка)
router.put('/cars/:id', admin, upload.array('photos', 10), async (req, res) => {
  try {
    const carId = req.params.id;
    const car = await Car.findByPk(carId);

    if (!car) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }

    const {
      brand,
      model,
      year,
      price,
      mileage,
      color,
      engine,
      transmission,
      fuelType,
      description,
      status,
      city
    } = req.body;

    // Запоминаем старую цену до изменений
    const oldPrice = car.price != null ? parseFloat(car.price) : null;

    // Обновление полей
    if (brand) car.brand = brand;
    if (model) car.model = model;
    if (year) car.year = parseInt(year);
    if (price) car.price = parseFloat(price);
    if (mileage !== undefined) car.mileage = parseInt(mileage);
    if (color !== undefined) car.color = color;
    if (engine !== undefined) car.engine = engine;
    if (transmission) car.transmission = transmission;
    if (fuelType) car.fuelType = fuelType;
    if (description !== undefined) car.description = description;
    if (status) car.status = status;
    
    // Обновление города и координат
    if (city !== undefined) {
      car.city = city || null;
      car.location = city || null;
      
      // Обновляем координаты, если указан город
      if (city) {
        const coords = getCityCoordinates(city);
        if (coords) {
          car.latitude = coords.lat;
          car.longitude = coords.lon;
        } else {
          car.latitude = null;
          car.longitude = null;
        }
      } else {
        car.latitude = null;
        car.longitude = null;
      }
    }

    // Добавление новых фото
    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map(file => `/uploads/cars/${file.filename}`);
      car.photos = [...car.photos, ...newPhotos];
    }

    await car.save();

    // После сохранения проверяем, снизилась ли цена
    const newPrice = car.price != null ? parseFloat(car.price) : null;
    const priceDecreased =
      oldPrice != null &&
      newPrice != null &&
      !Number.isNaN(oldPrice) &&
      !Number.isNaN(newPrice) &&
      newPrice < oldPrice;

    if (priceDecreased) {
      try {
        const io = req.app.get('io');
        if (io) {
          const { checkPriceAlerts } = require('../utils/priceAlertCron');
          await checkPriceAlerts(io);
        }
      } catch (err) {
        console.error('Ошибка проверки ценовых алертов после обновления автомобиля:', err);
      }
    }

    res.json({ message: 'Автомобиль успешно обновлен', car });
  } catch (error) {
    console.error('Ошибка обновления автомобиля:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении автомобиля' });
  }
});

// Удалить автомобиль полностью
router.delete('/cars/:id', admin, async (req, res) => {
  try {
    const carId = req.params.id;
    const car = await Car.findByPk(carId);

    if (!car) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }

    // Удаляем все связанные файлы фотографий с диска
    if (Array.isArray(car.photos) && car.photos.length > 0) {
      for (const photo of car.photos) {
        try {
          const photoPath = path.join(__dirname, '..', photo);
          if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
          }
        } catch (err) {
          console.error(`Ошибка удаления файла фото "${photo}":`, err);
        }
      }
    }

    await car.destroy();

    res.json({ message: 'Автомобиль удален из базы' });
  } catch (error) {
    console.error('Ошибка удаления автомобиля:', error);
    res.status(500).json({ message: 'Ошибка сервера при удалении автомобиля' });
  }
});

// Отключить/включить автомобиль
router.patch('/cars/:id/toggle', admin, async (req, res) => {
  try {
    const carId = req.params.id;
    const car = await Car.findByPk(carId);

    if (!car) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }

    car.isActive = !car.isActive;
    await car.save();

    res.json({
      message: car.isActive ? 'Автомобиль включен' : 'Автомобиль отключен',
      car
    });
  } catch (error) {
    console.error('Ошибка переключения статуса автомобиля:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить фото из автомобиля
router.delete('/cars/:id/photos/:photoIndex', admin, async (req, res) => {
  try {
    const carId = req.params.id;
    const photoIndex = parseInt(req.params.photoIndex);

    const car = await Car.findByPk(carId);

    if (!car) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }

    if (photoIndex < 0 || photoIndex >= car.photos.length) {
      return res.status(400).json({ message: 'Неверный индекс фото' });
    }

    // Удаляем файл с диска
    const photoPath = path.join(__dirname, '..', car.photos[photoIndex]);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    // Удаляем из массива
    car.photos.splice(photoIndex, 1);
    await car.save();

    res.json({ message: 'Фото удалено', car });
  } catch (error) {
    console.error('Ошибка удаления фото:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить все автомобили (включая неактивные и pending) для админа
router.get('/cars', admin, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    const cars = await Car.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json(cars);
  } catch (error) {
    console.error('Ошибка получения автомобилей:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить один автомобиль по ID (для админа)
router.get('/cars/:id', admin, async (req, res) => {
  try {
    const car = await Car.findByPk(req.params.id);

    if (!car) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }

    res.json(car);
  } catch (error) {
    console.error('Ошибка получения автомобиля:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить всех пользователей (для админа)
router.get('/users', admin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'city', 'role', 'createdAt', 'isDeleted']
    });

    res.json(users);
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении пользователей' });
  }
});

// Получить список администраторов
router.get('/users/admins', admin, async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { role: 'admin' },
      attributes: ['id', 'name', 'email', 'city', 'createdAt', 'isDeleted']
    });

    res.json(admins);
  } catch (error) {
    console.error('Ошибка получения администраторов:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении администраторов' });
  }
});

// Пометить аккаунт пользователя как удаленный
router.delete('/users/:id', admin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Нельзя удалить аккаунт администратора' });
    }

    if (user.isDeleted) {
      return res.status(400).json({ message: 'Аккаунт пользователя уже помечен как удаленный' });
    }

    user.isDeleted = true;
    await user.save();

    res.json({ message: 'Аккаунт пользователя помечен как удаленный' });
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера при удалении пользователя' });
  }
});

module.exports = router;
