const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const Car = require('../models/Car');
const Favorite = require('../models/Favorite');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { calculateDistanceFromCity, getCityCoordinates } = require('../utils/calculateDistance');

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

// Получить все автомобили с фильтрацией (доступно всем авторизованным пользователям)
router.get('/', auth, async (req, res) => {
  try {
    const {
      brand,
      model,
      minYear,
      maxYear,
      minPrice,
      maxPrice,
      transmission,
      fuelType,
      status,
      search,
      city,
      sortBy
    } = req.query;

    const where = {
      isActive: true
    };

    // Фильтр по статусу (для пользователей показываем только active)
    if (status) {
      where.status = status;
    } else {
      where.status = 'active';
    }

    // Фильтр по марке
    if (brand) {
      where.brand = { [Op.iLike]: `%${brand}%` };
    }

    // Фильтр по модели
    if (model) {
      where.model = { [Op.iLike]: `%${model}%` };
    }

    // Фильтр по году
    if (minYear || maxYear) {
      where.year = {};
      if (minYear) where.year[Op.gte] = parseInt(minYear);
      if (maxYear) where.year[Op.lte] = parseInt(maxYear);
    }

    // Фильтр по цене
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    // Фильтр по коробке передач
    if (transmission) {
      where.transmission = transmission;
    }

    // Фильтр по типу топлива
    if (fuelType) {
      where.fuelType = fuelType;
    }

    // Фильтр по городу
    if (city) {
      where.city = { [Op.iLike]: `%${city}%` };
    }

    // Поиск по названию (марка или модель)
    if (search) {
      where[Op.or] = [
        { brand: { [Op.iLike]: `%${search}%` } },
        { model: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Определение сортировки
    let orderBy = [['createdAt', 'DESC']];
    if (sortBy === 'city') {
      orderBy = [['city', 'ASC'], ['createdAt', 'DESC']];
    } else if (sortBy === 'price_asc') {
      orderBy = [['price', 'ASC']];
    } else if (sortBy === 'price_desc') {
      orderBy = [['price', 'DESC']];
    } else if (sortBy === 'year_desc') {
      orderBy = [['year', 'DESC']];
    } else if (sortBy === 'year_asc') {
      orderBy = [['year', 'ASC']];
    }

    const cars = await Car.findAll({
      where,
      order: orderBy
    });

    // Получаем средние оценки для всех автомобилей
    const CarValuation = require('../models/CarValuation');
    const carIds = cars.map(car => car.id);
    
    // Инициализируем карту рейтингов для всех автомобилей
    const ratingsMap = {};
    cars.forEach(car => {
      ratingsMap[car.id] = { sum: 0, count: 0 };
    });
    
    // Получаем все оценки для этих автомобилей (только если есть автомобили)
    if (carIds.length > 0) {
      try {
        const valuations = await CarValuation.findAll({
          where: { carId: carIds },
          attributes: ['carId', 'rating']
        });

        // Вычисляем средние оценки для каждого автомобиля
        valuations.forEach(v => {
          if (ratingsMap[v.carId]) {
            ratingsMap[v.carId].sum += v.rating;
            ratingsMap[v.carId].count += 1;
          }
        });
      } catch (error) {
        console.error('Ошибка получения оценок автомобилей:', error);
        // Продолжаем работу даже если не удалось получить оценки
      }
    }

    // Добавляем средние оценки к автомобилям
    let carsWithRatings = cars.map(car => {
      const carData = car.toJSON();
      const ratingData = ratingsMap[car.id];
      if (ratingData && ratingData.count > 0) {
        carData.averageRating = parseFloat((ratingData.sum / ratingData.count).toFixed(1));
        carData.totalRatings = ratingData.count;
      } else {
        // Всегда устанавливаем значения, даже если оценок нет
        carData.averageRating = 0;
        carData.totalRatings = 0;
      }
      return carData;
    });

    // Если пользователь указал город, добавляем расстояние до каждого автомобиля
    if (req.user) {
      const user = await User.findByPk(req.user.id);
      if (user && user.city) {
        carsWithRatings = carsWithRatings.map(car => {
          const distance = calculateDistanceFromCity(
            user.city,
            car.latitude,
            car.longitude
          );
          return {
            ...car,
            distance: distance
          };
        });
        return res.json(carsWithRatings);
      }
    }

    res.json(carsWithRatings);
  } catch (error) {
    console.error('Ошибка получения автомобилей:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Специфичные маршруты должны быть ПЕРЕД динамическим /:id
// Получить избранные автомобили пользователя
router.get('/favorites/list', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await Favorite.findAll({
      where: { userId: parseInt(userId) }
    });

    const carIds = favorites.map(fav => fav.carId);
    
    const cars = await Car.findAll({
      where: {
        id: carIds,
        isActive: true
      }
    });

    res.json(cars);
  } catch (error) {
    console.error('Ошибка получения избранного:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить один автомобиль по ID (должен быть после всех специфичных маршрутов)
router.get('/:id', auth, async (req, res) => {
  try {
    const requestedId = req.params.id;
    console.log(`[GET /cars/:id] Запрос автомобиля с ID: "${requestedId}" от пользователя ${req.user.id}`);
    
    // Проверяем, что это не специальный маршрут
    if (requestedId === 'favorites' || requestedId === 'sell') {
      console.log(`[GET /cars/:id] Специальный маршрут "${requestedId}" - возвращаем 404`);
      return res.status(404).json({ message: 'Маршрут не найден' });
    }

    const carId = parseInt(requestedId);
    
    if (isNaN(carId) || carId <= 0) {
      console.log(`[GET /cars/:id] Неверный ID: "${requestedId}" (parsed: ${carId})`);
      return res.status(400).json({ message: 'Неверный ID автомобиля' });
    }

    // Сначала ищем автомобиль без фильтра по isActive
    let car = await Car.findOne({
      where: {
        id: carId
      },
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'name', 'email', 'city'],
          required: false // LEFT JOIN вместо INNER JOIN
        }
      ]
    });

    if (!car) {
      console.log(`[GET /cars/${carId}] ❌ Автомобиль с ID ${carId} не найден в базе данных`);
      // Проверяем, существует ли вообще автомобиль с таким ID
      const carExists = await Car.findByPk(carId, { attributes: ['id'] });
      if (!carExists) {
        console.log(`[GET /cars/${carId}] Автомобиль с ID ${carId} действительно не существует в базе данных`);
      }
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }

    // Преобразуем в обычный объект для логирования
    const carData = car.toJSON ? car.toJSON() : car;
    
    console.log(`[GET /cars/${carId}] Найден автомобиль:`, {
      id: carData.id,
      brand: carData.brand,
      model: carData.model,
      sellerId: carData.sellerId,
      isActive: carData.isActive,
      status: carData.status,
      currentUserId: req.user.id,
      sellerIdType: typeof carData.sellerId,
      userIdType: typeof req.user.id
    });

    // Проверяем права доступа:
    // - Владелец может видеть свой автомобиль в любом статусе
    // - Другие пользователи могут видеть только активные автомобили
    const isOwner = carData.sellerId != null && parseInt(carData.sellerId) === parseInt(req.user.id);
    
    console.log(`[GET /cars/${carId}] Проверка доступа:`, {
      isOwner,
      sellerId: carData.sellerId,
      currentUserId: req.user.id,
      sellerIdParsed: parseInt(carData.sellerId),
      userIdParsed: parseInt(req.user.id),
      isActive: carData.isActive,
      status: carData.status
    });
    
    // Упрощенная логика доступа:
    // - Владелец может видеть свой автомобиль в любом статусе
    // - Для остальных: разрешаем доступ, если автомобиль не явно неактивен
    //   (isActive !== false означает, что разрешаем доступ для true, null, undefined)
    // Простая логика доступа:
    // - Владелец видит свой автомобиль всегда
    // - Для остальных: разрешаем доступ, если автомобиль найден
    //   Запрещаем ТОЛЬКО если isActive === false
    if (!isOwner) {
      // Для не-владельцев: запрещаем доступ ТОЛЬКО если isActive === false
      // (разрешаем для true, null, undefined)
      if (carData.isActive === false) {
        console.log(`[GET /cars/${carId}] ❌ Доступ запрещен: isActive=false`);
        return res.status(404).json({ 
          message: 'Автомобиль не найден или недоступен',
          details: process.env.NODE_ENV === 'development' ? 'Автомобиль неактивен' : undefined
        });
      }
      
      console.log(`[GET /cars/${carId}] ✅ Доступ разрешен (не владелец)`);
    } else {
      console.log(`[GET /cars/${carId}] ✅ Доступ разрешен (владелец)`);
    }

    // Увеличиваем счетчик просмотров для всех доступных автомобилей
    // Используем batch update вместо прямого обновления БД
    // Увеличиваем просмотры, если автомобиль не явно неактивен
    const canIncrementViews = carData.isActive !== false;
    if (canIncrementViews) {
      try {
        const { incrementView, getCurrentViews } = require('../utils/viewsBatchUpdate');
        incrementView(carId);
        
        // Получаем актуальное количество просмотров (из БД + кэша)
        const currentViews = await getCurrentViews(carId);
        carData.views = currentViews;
      } catch (error) {
        console.error(`[GET /cars/${carId}] Ошибка обновления просмотров:`, error);
        // Не блокируем ответ, если не удалось обновить просмотры
        carData.views = carData.views || 0;
      }
    } else {
      // Если автомобиль неактивен, используем текущее значение views из БД
      carData.views = carData.views || 0;
    }

    // Преобразуем в JSON и возвращаем
    console.log(`[GET /cars/${carId}] ✅ Успешно возвращаем автомобиль:`, {
      id: carData.id,
      brand: carData.brand,
      views: carData.views
    });
    res.json(carData);
  } catch (error) {
    console.error(`[GET /cars/${carId}] Ошибка получения автомобиля:`, error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Ошибка сервера', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Добавить автомобиль в избранное
router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    const userId = req.user.id;

    // Проверяем существование автомобиля
    const car = await Car.findOne({
      where: { id: carId, isActive: true }
    });

    if (!car) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }

    // Проверяем, не добавлен ли уже в избранное
    const existingFavorite = await Favorite.findOne({
      where: { userId: parseInt(userId), carId: parseInt(carId) }
    });

    if (existingFavorite) {
      return res.status(400).json({ message: 'Автомобиль уже в избранном' });
    }

    // Добавляем в избранное
    const favorite = await Favorite.create({
      userId: parseInt(userId),
      carId: parseInt(carId)
    });

    res.status(201).json({ message: 'Автомобиль добавлен в избранное', favorite });
  } catch (error) {
    console.error('Ошибка добавления в избранное:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить автомобиль из избранного
router.delete('/:id/favorite', auth, async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    const userId = req.user.id;

    const favorite = await Favorite.findOne({
      where: { userId: parseInt(userId), carId: parseInt(carId) }
    });

    if (!favorite) {
      return res.status(404).json({ message: 'Автомобиль не найден в избранном' });
    }

    await favorite.destroy();
    res.json({ message: 'Автомобиль удален из избранного' });
  } catch (error) {
    console.error('Ошибка удаления из избранного:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Продать автомобиль (создать объявление)
router.post('/sell', auth, upload.array('photos', 10), async (req, res) => {
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
      city
    } = req.body;

    // Валидация обязательных полей
    if (!brand || !model || !year || !price) {
      return res.status(400).json({ message: 'Заполните все обязательные поля: марка, модель, год, цена' });
    }

    // Валидация года
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      return res.status(400).json({ message: `Год должен быть от 1900 до ${currentYear + 1}` });
    }

    // Валидация цены
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ message: 'Цена должна быть положительным числом' });
    }

    // Валидация пробега
    const mileageNum = mileage ? parseInt(mileage) : 0;
    if (isNaN(mileageNum) || mileageNum < 0) {
      return res.status(400).json({ message: 'Пробег должен быть неотрицательным числом' });
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

    // Создаем автомобиль
    const car = await Car.create({
      brand,
      model,
      year: yearNum,
      price: priceNum,
      mileage: mileageNum,
      color: color || null,
      engine: engine || null,
      transmission: transmission || null,
      fuelType: fuelType || null,
      description: description || null,
      photos,
      status: 'pending', // Требует модерации
      isActive: true,
      city: city || null,
      latitude: latitude,
      longitude: longitude,
      location: city || null,
      sellerId: req.user.id // Сохраняем ID продавца
    });

    res.status(201).json({ 
      message: 'Объявление о продаже автомобиля успешно создано и отправлено на модерацию', 
      car 
    });
  } catch (error) {
    console.error('Ошибка создания объявления о продаже:', error);
    
    // Удаляем загруженные файлы в случае ошибки
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join(__dirname, '../uploads/cars', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    res.status(500).json({ 
      message: 'Ошибка сервера при создании объявления',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
