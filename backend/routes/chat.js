const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Car = require('../models/Car');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Создать или получить чат
router.post('/', auth, async (req, res) => {
  try {
    const { carId } = req.body;

    if (!carId) {
      return res.status(400).json({ message: 'Укажите carId' });
    }

    const parsedCarId = parseInt(carId);
    const currentUserId = parseInt(req.user.id);

    if (Number.isNaN(parsedCarId) || parsedCarId <= 0) {
      return res.status(400).json({ message: 'Неверный ID автомобиля' });
    }

    const car = await Car.findOne({
      where: { id: parsedCarId, isActive: true },
      include: [{ model: User, as: 'seller', attributes: ['id', 'name'] }]
    });

    if (!car) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }

    if (!car.sellerId) {
      return res.status(400).json({ message: 'У этого объявления не указан продавец, чат недоступен' });
    }

    const sellerId = parseInt(car.sellerId);

    if (!Number.isInteger(sellerId) || sellerId <= 0) {
      return res.status(400).json({ message: 'Некорректный продавец для этого объявления' });
    }

    if (sellerId === currentUserId) {
      return res.status(400).json({ message: 'Нельзя создать чат со своим автомобилем' });
    }

    // Ищем существующий чат
    let chat = await Chat.findOne({
      where: {
        carId: parsedCarId,
        buyerId: currentUserId,
        sellerId: sellerId
      },
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'seller', attributes: ['id', 'name', 'email'] },
        { model: Car, as: 'car', attributes: ['id', 'brand', 'model', 'price', 'photos'] }
      ]
    });

    if (!chat) {
      // Создаем новый чат
      chat = await Chat.create({
        carId: parsedCarId,
        buyerId: currentUserId,
        sellerId: sellerId
      });

      chat = await Chat.findByPk(chat.id, {
        include: [
          { model: User, as: 'buyer', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'seller', attributes: ['id', 'name', 'email'] },
          { model: Car, as: 'car', attributes: ['id', 'brand', 'model', 'price', 'photos'] }
        ]
      });
    }

    res.json(chat);
  } catch (error) {
    console.error('Ошибка создания чата:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить все чаты пользователя
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { buyerId: req.user.id },
          { sellerId: req.user.id }
        ]
      },
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'seller', attributes: ['id', 'name', 'email'] },
        { model: Car, as: 'car', attributes: ['id', 'brand', 'model', 'price', 'photos'] },
        {
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
          include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }]
        }
      ],
      order: [['lastMessageAt', 'DESC'], ['createdAt', 'DESC']]
    });

    // Подсчитываем непрочитанные сообщения для каждого чата
    const chatsWithUnread = await Promise.all(chats.map(async (chat) => {
      const unreadCount = await Message.count({
        where: {
          chatId: chat.id,
          senderId: { [require('sequelize').Op.ne]: req.user.id },
          read: false
        }
      });

      return {
        ...chat.toJSON(),
        unreadCount
      };
    }));

    res.json(chatsWithUnread);
  } catch (error) {
    console.error('Ошибка получения чатов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить один чат с сообщениями
router.get('/:id', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      where: {
        id: req.params.id,
        [require('sequelize').Op.or]: [
          { buyerId: req.user.id },
          { sellerId: req.user.id }
        ]
      },
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'seller', attributes: ['id', 'name', 'email'] },
        { model: Car, as: 'car', attributes: ['id', 'brand', 'model', 'price', 'photos'] }
      ]
    });

    if (!chat) {
      return res.status(404).json({ message: 'Чат не найден' });
    }

    // Получаем сообщения
    const messages = await Message.findAll({
      where: { chatId: chat.id },
      include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }],
      order: [['createdAt', 'ASC']]
    });

    // Отмечаем сообщения как прочитанные
    await Message.update(
      { read: true, readAt: new Date() },
      {
        where: {
          chatId: chat.id,
          senderId: { [require('sequelize').Op.ne]: req.user.id },
          read: false
        }
      }
    );

    res.json({ chat, messages });
  } catch (error) {
    console.error('Ошибка получения чата:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отправить сообщение
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Текст сообщения не может быть пустым' });
    }

    const chat = await Chat.findOne({
      where: {
        id: req.params.id,
        [require('sequelize').Op.or]: [
          { buyerId: req.user.id },
          { sellerId: req.user.id }
        ]
      }
    });

    if (!chat) {
      return res.status(404).json({ message: 'Чат не найден' });
    }

    const message = await Message.create({
      chatId: chat.id,
      senderId: req.user.id,
      text: text.trim(),
      read: false
    });

    // Обновляем lastMessageAt
    chat.lastMessageAt = new Date();
    await chat.save();

    // Получаем сообщение с отправителем
    const messageWithSender = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }]
    });

    // Отправляем через Socket.io
    const io = req.app.get('io');
    const recipientId = chat.buyerId === req.user.id ? chat.sellerId : chat.buyerId;
    
    // Отправляем сообщение всем в комнате чата
    io.to(`chat-${chat.id}`).emit('new-message', messageWithSender);
    
    // Также отправляем получателю напрямую (на случай, если он не в комнате)
    io.to(recipientId.toString()).emit('new-message', messageWithSender);

    // Создаем уведомление для получателя
    const recipient = await User.findByPk(recipientId);
    if (recipient) {
      const notification = await Notification.create({
        userId: recipientId,
        text: `Новое сообщение от ${req.user.name}`,
        type: 'MESSAGE',
        relatedCarId: chat.carId,
        relatedUserId: req.user.id
      });

      // Отправляем уведомление через Socket.io
      io.to(recipientId.toString()).emit('notification', {
        id: notification.id,
        text: notification.text,
        type: notification.type,
        read: false,
        createdAt: notification.createdAt
      });
    }

    res.status(201).json(messageWithSender);
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
