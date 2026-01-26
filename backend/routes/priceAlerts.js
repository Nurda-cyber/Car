const express = require('express');
const router = express.Router();
const PriceAlert = require('../models/PriceAlert');
const Car = require('../models/Car');
const auth = require('../middleware/auth');

// Создать ценовой алерт
router.post('/', auth, async (req, res) => {
  try {
    const { carId, targetPrice } = req.body;

    if (!carId || !targetPrice) {
      return res.status(400).json({ message: 'Укажите carId и targetPrice' });
    }

    const car = await Car.findOne({
      where: { id: carId, isActive: true }
    });

    if (!car) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }

    const targetPriceNum = parseFloat(targetPrice);
    if (isNaN(targetPriceNum) || targetPriceNum <= 0) {
      return res.status(400).json({ message: 'Целевая цена должна быть положительным числом' });
    }

    // Проверяем, не существует ли уже алерт для этого автомобиля
    const existingAlert = await PriceAlert.findOne({
      where: {
        userId: req.user.id,
        carId: carId,
        isActive: true
      }
    });

    if (existingAlert) {
      existingAlert.targetPrice = targetPriceNum;
      existingAlert.currentPrice = parseFloat(car.price);
      existingAlert.notified = false;
      await existingAlert.save();
      return res.json({ message: 'Алерт обновлен', alert: existingAlert });
    }

    const alert = await PriceAlert.create({
      userId: req.user.id,
      carId: carId,
      targetPrice: targetPriceNum,
      currentPrice: parseFloat(car.price),
      isActive: true,
      notified: false
    });

    res.status(201).json({ message: 'Алерт создан', alert });
  } catch (error) {
    console.error('Ошибка создания алерта:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить все алерты пользователя
router.get('/', auth, async (req, res) => {
  try {
    const alerts = await PriceAlert.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Car,
          as: 'car',
          attributes: ['id', 'brand', 'model', 'year', 'price', 'photos']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(alerts);
  } catch (error) {
    console.error('Ошибка получения алертов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить алерт
router.delete('/:id', auth, async (req, res) => {
  try {
    const alert = await PriceAlert.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!alert) {
      return res.status(404).json({ message: 'Алерт не найден' });
    }

    await alert.destroy();
    res.json({ message: 'Алерт удален' });
  } catch (error) {
    console.error('Ошибка удаления алерта:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
