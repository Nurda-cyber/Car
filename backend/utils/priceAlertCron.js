const cron = require('node-cron');
const PriceAlert = require('../models/PriceAlert');
const Car = require('../models/Car');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Функция для проверки ценовых алертов
const checkPriceAlerts = async (io) => {
  try {
    console.log('Проверка ценовых алертов...');
    
    // Проверяем, существует ли таблица price_alerts
    const sequelize = require('../config/database');
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'price_alerts'
      );
    `);
    
    if (!results[0].exists) {
      console.log('Таблица price_alerts еще не создана, пропускаем проверку');
      return;
    }
    
    // Проверяем, существует ли столбец views в таблице cars
    const [columnResults] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cars'
        AND column_name = 'views'
      );
    `);
    
    const hasViewsColumn = columnResults[0].exists;
    
    // Получаем все активные алерты
    const carAttributes = ['id', 'brand', 'model', 'year', 'price', 'photos', 'isActive'];
    if (hasViewsColumn) {
      carAttributes.push('views');
    }
    
    const alerts = await PriceAlert.findAll({
      where: { isActive: true, notified: false },
      include: [
        { 
          model: Car, 
          as: 'car',
          attributes: carAttributes
        },
        { model: User, as: 'user' }
      ]
    });

    for (const alert of alerts) {
      const car = alert.car;
      if (!car || !car.isActive) {
        continue;
      }

      const currentPrice = parseFloat(car.price);
      const targetPrice = parseFloat(alert.targetPrice);

      // Проверяем, упала ли цена до целевой или ниже
      if (currentPrice <= targetPrice) {
        // Создаем уведомление
        await Notification.create({
          userId: alert.userId,
          text: `Цена на ${car.brand} ${car.model} упала до ${currentPrice.toLocaleString('kk-KZ')} ₸`,
          type: 'price_drop',
          relatedCarId: car.id
        });

        // Отмечаем алерт как уведомленный
        alert.notified = true;
        alert.currentPrice = currentPrice;
        await alert.save();

        // Отправляем уведомление через Socket.io
        if (io) {
          io.to(alert.userId.toString()).emit('notification', {
            text: `Цена на ${car.brand} ${car.model} упала до ${currentPrice.toLocaleString('kk-KZ')} ₸`,
            type: 'price_drop',
            carId: car.id
          });
        }

        console.log(`Уведомление отправлено пользователю ${alert.userId} о падении цены на автомобиль ${car.id}`);
      } else {
        // Обновляем текущую цену в алерте
        alert.currentPrice = currentPrice;
        await alert.save();
      }
    }

    console.log(`Проверка завершена. Обработано ${alerts.length} алертов.`);
  } catch (error) {
    console.error('Ошибка проверки ценовых алертов:', error);
  }
};

// Запуск cron job каждые 30 минут
const startPriceAlertCron = (io) => {
  // Проверяем сразу при запуске (с небольшой задержкой для гарантии синхронизации)
  setTimeout(() => {
    checkPriceAlerts(io);
  }, 2000);

  // Затем каждые 30 минут
  cron.schedule('*/30 * * * *', () => {
    checkPriceAlerts(io);
  });

  console.log('Cron job для ценовых алертов запущен (каждые 30 минут)');
};

module.exports = { startPriceAlertCron, checkPriceAlerts };
