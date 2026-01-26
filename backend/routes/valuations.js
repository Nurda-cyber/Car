const express = require('express');
const router = express.Router();
const CarValuation = require('../models/CarValuation');
const Car = require('../models/Car');
const auth = require('../middleware/auth');

// Создать или обновить оценку автомобиля
router.post('/', auth, async (req, res) => {
  try {
    const { carId, rating, estimatedPrice, comment } = req.body;

    if (!carId || !rating) {
      return res.status(400).json({ message: 'Укажите carId и rating' });
    }

    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'Рейтинг должен быть от 1 до 5' });
    }

    const car = await Car.findOne({
      where: { id: carId, isActive: true }
    });

    if (!car) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }

    // Проверяем, существует ли уже оценка от этого пользователя
    let valuation = await CarValuation.findOne({
      where: {
        carId: carId,
        userId: req.user.id
      }
    });

    if (valuation) {
      // Обновляем существующую оценку
      valuation.rating = ratingNum;
      valuation.estimatedPrice = estimatedPrice ? parseFloat(estimatedPrice) : null;
      valuation.comment = comment || null;
      await valuation.save();
      return res.json({ message: 'Оценка обновлена', valuation });
    }

    // Создаем новую оценку
    valuation = await CarValuation.create({
      carId: carId,
      userId: req.user.id,
      rating: ratingNum,
      estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : null,
      comment: comment || null
    });

    res.status(201).json({ message: 'Оценка создана', valuation });
  } catch (error) {
    console.error('Ошибка создания оценки:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить все оценки автомобиля
router.get('/car/:carId', auth, async (req, res) => {
  try {
    const valuations = await CarValuation.findAll({
      where: { carId: req.params.carId },
      include: [
        {
          model: require('../models/User'),
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Вычисляем средний рейтинг
    const avgRating = valuations.length > 0
      ? valuations.reduce((sum, v) => sum + v.rating, 0) / valuations.length
      : 0;

    res.json({
      valuations,
      averageRating: avgRating.toFixed(2),
      totalValuations: valuations.length
    });
  } catch (error) {
    console.error('Ошибка получения оценок:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить оценку текущего пользователя для автомобиля
router.get('/car/:carId/my', auth, async (req, res) => {
  try {
    const valuation = await CarValuation.findOne({
      where: {
        carId: req.params.carId,
        userId: req.user.id
      }
    });

    res.json(valuation || null);
  } catch (error) {
    console.error('Ошибка получения оценки:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
