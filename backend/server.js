const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./config/database');
const User = require('./models/User');
const Car = require('./models/Car');
const Favorite = require('./models/Favorite');
const Cart = require('./models/Cart');
const PurchaseHistory = require('./models/PurchaseHistory');
const Notification = require('./models/Notification');
const PriceAlert = require('./models/PriceAlert');
const CarValuation = require('./models/CarValuation');
const Chat = require('./models/Chat');
const Message = require('./models/Message');
const SellerRating = require('./models/SellerRating');
const createDatabaseIfNotExists = require('./utils/createDatabase');
const addRoleColumn = require('./utils/addRoleColumn');
const ensureBalance = require('./utils/ensureBalance');
const addViewsColumn = require('./utils/addViewsColumn');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

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
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/price-alerts', require('./routes/priceAlerts'));
app.use('/api/valuations', require('./routes/valuations'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/seller-ratings', require('./routes/sellerRatings'));

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
User.hasMany(Car, { foreignKey: 'sellerId', as: 'soldCars' });
Car.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

// Новые связи
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Car.hasMany(Notification, { foreignKey: 'relatedCarId', as: 'notifications' });
Notification.belongsTo(Car, { foreignKey: 'relatedCarId', as: 'car' });

User.hasMany(PriceAlert, { foreignKey: 'userId', as: 'priceAlerts' });
PriceAlert.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Car.hasMany(PriceAlert, { foreignKey: 'carId', as: 'priceAlerts' });
PriceAlert.belongsTo(Car, { foreignKey: 'carId', as: 'car' });

User.hasMany(CarValuation, { foreignKey: 'userId', as: 'valuations' });
CarValuation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Car.hasMany(CarValuation, { foreignKey: 'carId', as: 'valuations' });
CarValuation.belongsTo(Car, { foreignKey: 'carId', as: 'car' });

User.hasMany(Chat, { foreignKey: 'buyerId', as: 'buyerChats' });
User.hasMany(Chat, { foreignKey: 'sellerId', as: 'sellerChats' });
Chat.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });
Chat.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
Car.hasMany(Chat, { foreignKey: 'carId', as: 'chats' });
Chat.belongsTo(Car, { foreignKey: 'carId', as: 'car' });

Chat.hasMany(Message, { foreignKey: 'chatId', as: 'messages' });
Message.belongsTo(Chat, { foreignKey: 'chatId', as: 'chat' });
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

User.hasMany(SellerRating, { foreignKey: 'sellerId', as: 'sellerRatings' });
SellerRating.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
User.hasMany(SellerRating, { foreignKey: 'userId', as: 'givenRatings' });
SellerRating.belongsTo(User, { foreignKey: 'userId', as: 'user' });

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
    
    // Добавляем столбец views если его нет
    try {
      await addViewsColumn();
    } catch (error) {
      console.log('Проверка столбца views завершена:', error.message);
    }
    
    // Запускаем cron job только после успешной синхронизации
    const { startPriceAlertCron } = require('./utils/priceAlertCron');
    startPriceAlertCron(io);
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

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);
  connectedUsers.set(socket.userId, socket.id);

  socket.on('join-chat', (chatId) => {
    socket.join(`chat-${chatId}`);
  });

  socket.on('leave-chat', (chatId) => {
    socket.leave(`chat-${chatId}`);
  });

  socket.on('typing', ({ chatId, isTyping }) => {
    socket.to(`chat-${chatId}`).emit('typing', { userId: socket.userId, isTyping });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
    connectedUsers.delete(socket.userId);
  });
});

// Export io for use in routes
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
