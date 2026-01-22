const express = require('express');
const { Op } = require('sequelize');
const Car = require('../models/Car');
const Favorite = require('../models/Favorite');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { calculateDistanceFromCity } = require('../utils/calculateDistance');

const router = express.Router();

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

    // Если пользователь указал город, добавляем расстояние до каждого автомобиля
    if (req.user) {
      const user = await User.findByPk(req.user.id);
      if (user && user.city) {
        const carsWithDistance = cars.map(car => {
          const distance = calculateDistanceFromCity(
            user.city,
            car.latitude,
            car.longitude
          );
          return {
            ...car.toJSON(),
            distance: distance
          };
        });
        return res.json(carsWithDistance);
      }
    }

    res.json(cars);
  } catch (error) {
    console.error('Ошибка получения автомобилей:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить один автомобиль по ID
router.get('/:id', auth, async (req, res) => {
  try {
    const car = await Car.findOne({
      where: {
        id: req.params.id,
        isActive: true
      }
    });

    if (!car) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }

    res.json(car);
  } catch (error) {
    console.error('Ошибка получения автомобиля:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
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
      where: { userId, carId }
    });

    if (existingFavorite) {
      return res.status(400).json({ message: 'Автомобиль уже в избранном' });
    }

    // Добавляем в избранное
    const favorite = await Favorite.create({
      userId,
      carId
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
      where: { userId, carId }
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

// Получить избранные автомобили пользователя
router.get('/favorites/list', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await Favorite.findAll({
      where: { userId }
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

module.exports = router;
