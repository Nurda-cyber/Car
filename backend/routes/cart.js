const express = require('express');
const Cart = require('../models/Cart');
const Car = require('../models/Car');
const User = require('../models/User');
const PurchaseHistory = require('../models/PurchaseHistory');
const sequelize = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Получить все товары в корзине пользователя
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{
        model: Car,
        as: 'car',
        required: false,
        attributes: ['id', 'brand', 'model', 'year', 'price', 'mileage', 'transmission', 'fuelType', 'photos', 'status', 'isActive', 'latitude', 'longitude', 'location']
      }]
    });

    // Фильтруем только активные автомобили и убираем записи без автомобиля
    // Одновременно удаляем некорректные записи из базы данных
    const invalidCartItemIds = [];
    const activeCartItems = cartItems
      .filter(item => {
        if (!item || !item.car || !item.carId) {
          invalidCartItemIds.push(item.id);
          return false;
        }
        const carId = parseInt(item.carId);
        if (isNaN(carId) || carId <= 0) {
          invalidCartItemIds.push(item.id);
          return false;
        }
        if (!item.car.isActive) {
          invalidCartItemIds.push(item.id);
          return false;
        }
        return true;
      })
      .map(item => ({
        id: item.id,
        userId: item.userId,
        carId: parseInt(item.carId), // Убеждаемся, что carId - число
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        car: item.car
      }));

    // Удаляем некорректные записи из базы данных
    if (invalidCartItemIds.length > 0) {
      await Cart.destroy({
        where: {
          id: invalidCartItemIds
        }
      });
    }

    res.json(activeCartItems);
  } catch (error) {
    console.error('Ошибка получения корзины:', error);
    console.error('Детали ошибки:', error.message);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Купить все товары из корзины (маршрут до /:id, иначе "checkout" попадёт в id)
router.post('/checkout', auth, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const userId = req.user.id;

    // Получаем все товары в корзине
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{
        model: Car,
        as: 'car',
        required: false,
        attributes: ['id', 'brand', 'model', 'year', 'price', 'mileage', 'transmission', 'fuelType', 'photos', 'status', 'isActive']
      }],
      transaction
    });

    console.log(`[CHECKOUT] Найдено записей в корзине: ${cartItems.length}`);

    // Фильтруем только активные автомобили и проверяем валидность carId
    // Одновременно собираем ID некорректных записей для удаления
    const invalidCartItemIds = [];
    const activeCartItems = cartItems.filter(item => {
      if (!item || !item.car || !item.carId) {
        if (item && item.id) {
          invalidCartItemIds.push(item.id);
        }
        return false;
      }
      const carId = parseInt(item.carId);
      if (isNaN(carId) || carId <= 0) {
        if (item.id) {
          invalidCartItemIds.push(item.id);
        }
        return false;
      }
      if (!item.car.isActive) {
        if (item.id) {
          invalidCartItemIds.push(item.id);
        }
        return false;
      }
      return true;
    });
    
    // Удаляем некорректные записи из корзины в рамках транзакции
    if (invalidCartItemIds.length > 0) {
      await Cart.destroy({
        where: {
          id: invalidCartItemIds,
          userId: userId
        },
        transaction
      });
    }
    
    if (activeCartItems.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Корзина пуста или все автомобили уже проданы' });
    }

    // Вычисляем общую стоимость только для валидных автомобилей
    let totalPrice = 0;
    const validItems = [];
    
    for (const item of activeCartItems) {
      if (!item || !item.car || !item.car.price) {
        console.log(`[CHECKOUT] Пропущен элемент корзины: нет данных автомобиля или цены`);
        continue; // Пропускаем некорректные записи
      }
      const price = parseFloat(item.car.price);
      if (isNaN(price) || price <= 0) {
        console.log(`[CHECKOUT] Пропущен элемент корзины: некорректная цена ${item.car.price}`);
        continue; // Пропускаем записи с некорректной ценой
      }
      totalPrice += price;
      validItems.push(item);
      console.log(`[CHECKOUT] Добавлен валидный автомобиль: ID=${item.carId}, цена=${price}`);
    }
    
    console.log(`[CHECKOUT] Итого валидных автомобилей: ${validItems.length}, общая стоимость: ${totalPrice}`);

    // Если после фильтрации не осталось валидных автомобилей
    if (validItems.length === 0) {
      await transaction.rollback();
      console.log('[CHECKOUT] Нет валидных автомобилей для покупки');
      return res.status(400).json({ message: 'В корзине нет автомобилей с корректными данными для покупки' });
    }

    console.log(`[CHECKOUT] Валидных автомобилей для покупки: ${validItems.length}, Общая стоимость: ${totalPrice}`);

    // Проверяем, что общая стоимость корректна
    if (totalPrice <= 0 || isNaN(totalPrice)) {
      await transaction.rollback();
      console.log('[CHECKOUT] Некорректная общая стоимость');
      return res.status(400).json({ message: 'Некорректная общая стоимость покупки' });
    }

    // Получаем пользователя с балансом
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      console.log('[CHECKOUT] Пользователь не найден');
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем баланс
    const userBalance = parseFloat(user.balance || 0);
    console.log(`[CHECKOUT] Баланс пользователя: ${userBalance}, Требуется: ${totalPrice}`);
    
    if (isNaN(userBalance) || userBalance < totalPrice) {
      await transaction.rollback();
      console.log('[CHECKOUT] Недостаточно средств, транзакция откачена');
      return res.status(400).json({ 
        message: 'Недостаточно средств на балансе',
        required: totalPrice,
        available: userBalance
      });
    }

    // Выполняем покупку
    const newBalance = userBalance - totalPrice;
    user.balance = newBalance;
    await user.save({ transaction });
    console.log(`[CHECKOUT] Баланс обновлен: ${userBalance} -> ${newBalance}`);

    // Обновляем статус автомобилей на 'sold' и сохраняем в историю
    // Пропускаем некорректные записи, но продолжаем обработку валидных
    const purchasedCars = [];
    const failedCars = [];
    
    // Используем только валидные элементы для покупки
    for (const item of validItems) {
      try {
        // carId уже проверен ранее, но проверяем еще раз для безопасности
        const carId = parseInt(item.carId);
        if (!carId || carId <= 0) {
          console.log(`[CHECKOUT] Пропущен автомобиль с некорректным ID: ${item.carId}`);
          failedCars.push({ carId: item.carId, reason: 'Некорректный ID' });
          continue;
        }

        // Используем автомобиль из item.car, так как он уже загружен
        if (!item.car || !item.car.id) {
          console.log(`[CHECKOUT] Автомобиль не загружен для ID: ${carId}`);
          failedCars.push({ carId: carId, reason: 'Автомобиль не загружен' });
          continue;
        }

        const car = item.car;
        
        // Обновляем статус автомобиля
        car.status = 'sold';
        car.isActive = false;
        await car.save({ transaction });
        console.log(`[CHECKOUT] Статус автомобиля ${carId} обновлен на 'sold'`);

        // Сохраняем покупку в историю
        await PurchaseHistory.create({
          userId: userId,
          carId: car.id,
          price: parseFloat(car.price),
          purchaseDate: new Date()
        }, { transaction });
        console.log(`[CHECKOUT] Покупка автомобиля ${carId} сохранена в историю`);

        purchasedCars.push(carId);
        console.log(`[CHECKOUT] Автомобиль ${carId} успешно куплен`);
      } catch (itemError) {
        console.error(`[CHECKOUT] Ошибка обработки автомобиля ${item.carId}:`, itemError);
        console.error(`[CHECKOUT] Детали ошибки:`, itemError.message);
        failedCars.push({ carId: item.carId, reason: itemError.message || 'Ошибка обработки' });
        // Продолжаем обработку остальных автомобилей
      }
    }

    console.log(`[CHECKOUT] Успешно куплено автомобилей: ${purchasedCars.length}, Не удалось: ${failedCars.length}`);

    // Если не удалось купить ни одного автомобиля, откатываем транзакцию
    if (purchasedCars.length === 0) {
      await transaction.rollback();
      console.log('[CHECKOUT] Транзакция откачена: не удалось купить ни одного автомобиля');
      return res.status(400).json({ 
        message: 'Не удалось купить ни одного автомобиля',
        failedCars: failedCars
      });
    }

    // Очищаем корзину - удаляем только купленные автомобили
    // Некорректные записи уже удалены ранее
    const purchasedCartItemIds = validItems
      .filter(item => purchasedCars.includes(parseInt(item.carId)))
      .map(item => item.id);
    
    if (purchasedCartItemIds.length > 0) {
      await Cart.destroy({ 
        where: { 
          id: purchasedCartItemIds,
          userId: userId 
        }, 
        transaction 
      });
    }

    // Подтверждаем транзакцию
    await transaction.commit();
    console.log('[CHECKOUT] Транзакция успешно завершена и закоммичена');

    // Получаем актуальный баланс после коммита транзакции
    const updatedUser = await User.findByPk(userId);
    const finalBalance = updatedUser ? parseFloat(updatedUser.balance) : newBalance;
    
    console.log(`[CHECKOUT] Финальный баланс пользователя: ${finalBalance}`);
    console.log(`[CHECKOUT] Куплено автомобилей: ${purchasedCars.length}, ID: [${purchasedCars.join(', ')}]`);
    
    // Формируем ответ с информацией о покупке
    const response = {
      message: `Покупка успешно завершена. Куплено автомобилей: ${purchasedCars.length}`,
      totalPrice,
      newBalance: finalBalance,
      purchasedCars: purchasedCars.length
    };

    // Если были пропущенные автомобили, добавляем информацию об этом
    if (failedCars.length > 0) {
      response.warning = `Некоторые автомобили не были куплены: ${failedCars.length}`;
      response.failedCars = failedCars;
    }

    console.log('[CHECKOUT] Отправка ответа клиенту:', response);
    res.json(response);
  } catch (error) {
    // Убеждаемся, что транзакция откатывается
    if (!transaction.finished) {
      await transaction.rollback();
      console.log('[CHECKOUT] Транзакция откачена из-за ошибки');
    }
    console.error('[CHECKOUT] Ошибка покупки:', error);
    console.error('[CHECKOUT] Детали ошибки:', error.message);
    console.error('[CHECKOUT] Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Ошибка сервера при выполнении покупки',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Добавить автомобиль в корзину
router.post('/:id', auth, async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    const userId = req.user.id;

    if (isNaN(carId) || carId <= 0) {
      return res.status(400).json({ message: 'Неверный ID автомобиля' });
    }

    const car = await Car.findOne({
      where: { id: carId, isActive: true }
    });

    if (!car) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }

    const existingCartItem = await Cart.findOne({
      where: { userId, carId }
    });

    if (existingCartItem) {
      return res.status(400).json({ message: 'Автомобиль уже в корзине' });
    }

    const cartItem = await Cart.create({
      userId: parseInt(userId),
      carId: parseInt(carId)
    });

    res.status(201).json({ message: 'Автомобиль добавлен в корзину', cartItem });
  } catch (error) {
    console.error('Ошибка добавления в корзину:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить автомобиль из корзины
router.delete('/:id', auth, async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    const userId = req.user.id;

    if (isNaN(carId) || carId <= 0) {
      return res.status(400).json({ message: 'Неверный ID автомобиля' });
    }

    const cartItem = await Cart.findOne({
      where: { userId, carId }
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Автомобиль не найден в корзине' });
    }

    await cartItem.destroy();
    res.json({ message: 'Автомобиль удален из корзины' });
  } catch (error) {
    console.error('Ошибка удаления из корзины:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
