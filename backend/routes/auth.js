const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PurchaseHistory = require('../models/PurchaseHistory');
const Car = require('../models/Car');
const auth = require('../middleware/auth');

const router = express.Router();

// Генерация JWT токена
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production', {
    expiresIn: '30d'
  });
};

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Валидация
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Пожалуйста, заполните все поля' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Пароль должен быть не менее 6 символов' });
    }

    // Проверка существования пользователя
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    // Создание пользователя
    const user = await User.create({
      name,
      email,
      password
    });

    // Генерация токена
    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        bankCard: user.bankCard,
        city: user.city,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

// Вход
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Валидация
    if (!email || !password) {
      return res.status(400).json({ message: 'Пожалуйста, заполните все поля' });
    }

    // Поиск пользователя
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    // Проверяем, не удален ли аккаунт администратором
    if (user.isDeleted) {
      return res.status(403).json({ message: 'Ваш аккаунт был удален администратором' });
    }

    // Проверка пароля
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    // Генерация токена
    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        bankCard: user.bankCard,
        city: user.city,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ message: 'Ошибка сервера при входе' });
  }
});

// Получение информации о текущем пользователе
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        bankCard: user.bankCard,
        city: user.city,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Ошибка получения данных пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление профиля пользователя
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, password, bankCard, city } = req.body;
    const userId = req.user.id;

    // Валидация
    if (!name || !email) {
      return res.status(400).json({ message: 'Имя и email обязательны для заполнения' });
    }

    // Проверка email на уникальность (если изменился)
    if (email !== req.user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
      }
    }

    // Обновление данных пользователя
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    user.name = name;
    user.email = email;

    // Обновление пароля (если указан)
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Пароль должен быть не менее 6 символов' });
      }
      user.password = password; // Хук beforeUpdate автоматически захеширует пароль
    }

    // Обновление банковской карты (если указана)
    if (req.body.bankCard !== undefined) {
      // Убираем пробелы и проверяем, что это только цифры
      const cardNumber = String(req.body.bankCard || '').replace(/\s/g, '').replace(/\D/g, '');
      if (cardNumber && cardNumber.length > 0) {
        if (cardNumber.length < 16 || cardNumber.length > 19) {
          return res.status(400).json({ message: 'Номер карты должен содержать от 16 до 19 цифр' });
        }
        user.bankCard = cardNumber;
      } else {
        // Если пустая строка, устанавливаем null
        user.bankCard = null;
      }
    }

    // Обновление города
    if (req.body.city !== undefined) {
      user.city = req.body.city || null;
    }

    await user.save();

    res.json({
      message: 'Профиль успешно обновлен',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        bankCard: user.bankCard,
        city: user.city,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении профиля' });
  }
});

// Получение истории покупок пользователя
router.get('/purchase-history', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const purchases = await PurchaseHistory.findAll({
      where: { userId },
      include: [{
        model: Car,
        as: 'car',
        attributes: ['id', 'brand', 'model', 'year', 'price', 'mileage', 'transmission', 'fuelType', 'photos', 'city']
      }],
      order: [['purchaseDate', 'DESC']]
    });

    res.json(purchases);
  } catch (error) {
    console.error('Ошибка получения истории покупок:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении истории покупок' });
  }
});

module.exports = router;
