const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const sequelize = require('./config/database');
const User = require('./models/User');
const Car = require('./models/Car');
const Favorite = require('./models/Favorite');
const Cart = require('./models/Cart');
const PurchaseHistory = require('./models/PurchaseHistory');
const createDatabaseIfNotExists = require('./utils/createDatabase');
const addRoleColumn = require('./utils/addRoleColumn');
const ensureBalance = require('./utils/ensureBalance');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Статические файлы для загруженных изображений
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cars', require('./routes/cars'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/cart', require('./routes/cart'));

// Настройка связей между моделями
User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Car.hasMany(Favorite, { foreignKey: 'carId', as: 'favorites' });
Favorite.belongsTo(Car, { foreignKey: 'carId', as: 'car' });
User.hasMany(Cart, { foreignKey: 'userId', as: 'carts' });
Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Car.hasMany(Cart, { foreignKey: 'carId', as: 'carts' });
Cart.belongsTo(Car, { foreignKey: 'carId', as: 'car' });
User.hasMany(PurchaseHistory, { foreignKey: 'userId', as: 'purchases' });
PurchaseHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Car.hasMany(PurchaseHistory, { foreignKey: 'carId', as: 'purchases' });
PurchaseHistory.belongsTo(Car, { foreignKey: 'carId', as: 'car' });

// PostgreSQL connection
const connectDB = async () => {
  try {
    // Сначала пытаемся создать базу данных, если её нет
    await createDatabaseIfNotExists();
    
    // Теперь подключаемся к нужной базе данных
    await sequelize.authenticate();
    console.log('PostgreSQL подключен');

    // Добавляем столбец role если его нет (для существующих таблиц)
    try {
      await addRoleColumn();
    } catch (error) {
      // Игнорируем ошибку, если столбец уже существует или таблица еще не создана
      console.log('Проверка столбца role завершена');
    }

    // Убеждаемся, что у пользователей есть баланс для покупок (NULL/0 → 5 000 000)
    try {
      await ensureBalance();
    } catch (error) {
      console.log('Проверка баланса завершена:', error.message);
    }

    // Синхронизация моделей с базой данных (создание таблиц если их нет, добавление новых столбцов)
    await sequelize.sync({ alter: true });
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
