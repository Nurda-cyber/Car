const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Получить все уведомления пользователя
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json(notifications);
  } catch (error) {
    console.error('Ошибка получения уведомлений:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить количество непрочитанных уведомлений
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.count({
      where: {
        userId: req.user.id,
        read: false
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Ошибка получения количества уведомлений:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отметить уведомление как прочитанное
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Уведомление не найдено' });
    }

    notification.read = true;
    await notification.save();

    res.json({ message: 'Уведомление отмечено как прочитанное', notification });
  } catch (error) {
    console.error('Ошибка обновления уведомления:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отметить все уведомления как прочитанные
router.patch('/read-all', auth, async (req, res) => {
  try {
    await Notification.update(
      { read: true },
      {
        where: {
          userId: req.user.id,
          read: false
        }
      }
    );

    res.json({ message: 'Все уведомления отмечены как прочитанные' });
  } catch (error) {
    console.error('Ошибка обновления уведомлений:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить уведомление
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Уведомление не найдено' });
    }

    await notification.destroy();
    res.json({ message: 'Уведомление удалено' });
  } catch (error) {
    console.error('Ошибка удаления уведомления:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
