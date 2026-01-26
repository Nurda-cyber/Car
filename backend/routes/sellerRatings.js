const express = require('express');
const router = express.Router();
const SellerRating = require('../models/SellerRating');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Создать или обновить рейтинг продавца
router.post('/', auth, async (req, res) => {
  try {
    const { sellerId, rating, comment } = req.body;

    if (!sellerId || !rating) {
      return res.status(400).json({ message: 'Укажите sellerId и rating' });
    }

    if (sellerId === req.user.id) {
      return res.status(400).json({ message: 'Нельзя оценить самого себя' });
    }

    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'Рейтинг должен быть от 1 до 5' });
    }

    const seller = await User.findByPk(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Продавец не найден' });
    }

    // Проверяем, существует ли уже рейтинг от этого пользователя
    let sellerRating = await SellerRating.findOne({
      where: {
        sellerId: sellerId,
        userId: req.user.id
      }
    });

    if (sellerRating) {
      // Обновляем существующий рейтинг
      sellerRating.rating = ratingNum;
      sellerRating.comment = comment || null;
      await sellerRating.save();
      return res.json({ message: 'Рейтинг обновлен', rating: sellerRating });
    }

    // Создаем новый рейтинг
    sellerRating = await SellerRating.create({
      sellerId: sellerId,
      userId: req.user.id,
      rating: ratingNum,
      comment: comment || null
    });

    res.status(201).json({ message: 'Рейтинг создан', rating: sellerRating });
  } catch (error) {
    console.error('Ошибка создания рейтинга:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить все рейтинги продавца
router.get('/seller/:sellerId', auth, async (req, res) => {
  try {
    const ratings = await SellerRating.findAll({
      where: { sellerId: req.params.sellerId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Вычисляем средний рейтинг
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    res.json({
      ratings,
      averageRating: avgRating.toFixed(2),
      totalRatings: ratings.length
    });
  } catch (error) {
    console.error('Ошибка получения рейтингов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить рейтинг текущего пользователя для продавца
router.get('/seller/:sellerId/my', auth, async (req, res) => {
  try {
    const rating = await SellerRating.findOne({
      where: {
        sellerId: req.params.sellerId,
        userId: req.user.id
      }
    });

    res.json(rating || null);
  } catch (error) {
    console.error('Ошибка получения рейтинга:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
