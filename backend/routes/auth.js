const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
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
        email: user.email
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
        email: user.email
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
    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('Ошибка получения данных пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
