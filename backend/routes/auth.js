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
        email: user.email,
        role: user.role,
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
    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt
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
    const { name, email, password } = req.body;
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

    await user.save();

    res.json({
      message: 'Профиль успешно обновлен',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении профиля' });
  }
});

module.exports = router;
