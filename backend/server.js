const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const User = require('./models/User');
const createDatabaseIfNotExists = require('./utils/createDatabase');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));

// PostgreSQL connection
const connectDB = async () => {
  try {
    // Сначала пытаемся создать базу данных, если её нет
    await createDatabaseIfNotExists();
    
    // Теперь подключаемся к нужной базе данных
    await sequelize.authenticate();
    console.log('PostgreSQL подключен');

    // Синхронизация моделей с базой данных (создание таблиц если их нет)
    await sequelize.sync({ alter: false });
    console.log('Модели синхронизированы с базой данных');
  } catch (error) {
    console.error('Ошибка подключения к PostgreSQL:', error.message);
    if (error.message.includes('does not exist')) {
      console.error('\nПопробуйте создать базу данных вручную:');
      console.error(`CREATE DATABASE ${process.env.DB_NAME || 'authapp'};`);
    }
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
