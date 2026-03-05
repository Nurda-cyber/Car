const request = require('supertest');
const express = require('express');
const sequelize = require('../config/database');
const Car = require('../models/Car');
const User = require('../models/User');

jest.mock('../middleware/auth', () => (req, res, next) => {
  const id = process.env.TEST_USER_ID ? parseInt(process.env.TEST_USER_ID, 10) : 1;
  req.user = { id };
  next();
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const carsRouter = require('../routes/cars');

app.use('/api/cars', carsRouter);

describe('POST /api/cars/sell - Продажа автомобиля', () => {
  let testUser;

  beforeAll(async () => {
    try {
      await sequelize.authenticate();
    } catch (error) {
      console.error('Ошибка подключения к БД:', error);
    }
  });

  beforeEach(async () => {
    try {
      const [user] = await User.findOrCreate({
        where: { email: 'test-sell@example.com' },
        defaults: {
          name: 'Test Seller',
          email: 'test-sell@example.com',
          password: 'password123',
          balance: 10000000
        }
      });
      testUser = user;
      process.env.TEST_USER_ID = String(user.id);
    } catch (error) {
      console.error('Ошибка создания тестового пользователя:', error);
    }
  });

  afterEach(async () => {
    try {
      await Car.destroy({ where: { sellerId: 1 }, force: true });
    } catch (error) {
      console.error('Ошибка очистки данных:', error);
    }
  });

  afterAll(async () => {
    try {
      await User.destroy({ where: { email: 'test-sell@example.com' }, force: true });
      await sequelize.close();
    } catch (error) {
      console.error('Ошибка закрытия соединения:', error);
    }
  });

  test('должен создать объявление о продаже с валидными данными', async () => {
    const carData = {
      brand: 'Toyota',
      model: 'Camry',
      year: '2020',
      price: '5000000',
      mileage: '50000',
      color: 'Black',
      transmission: 'automatic',
      fuelType: 'petrol',
      city: 'Алматы',
      description: 'Отличное состояние'
    };

    const response = await request(app)
      .post('/api/cars/sell')
      .send(carData)
      .expect(201);

    expect(response.body.message).toContain('успешно создано');
    expect(response.body.car).toBeDefined();
    expect(response.body.car.brand).toBe('Toyota');
    expect(response.body.car.model).toBe('Camry');
    expect(response.body.car.sellerId).toBe(testUser.id);
    expect(response.body.car.status).toBe('pending');
  });

  test('должен вернуть ошибку при отсутствии обязательных полей', async () => {
    const carData = {
      brand: 'Toyota'
    };

    const response = await request(app)
      .post('/api/cars/sell')
      .send(carData)
      .expect(400);

    expect(response.body.message).toContain('обязательные поля');
  });

  test('должен вернуть ошибку при невалидном годе', async () => {
    const carData = {
      brand: 'Toyota',
      model: 'Camry',
      year: '1800',
      price: '5000000'
    };

    const response = await request(app)
      .post('/api/cars/sell')
      .send(carData)
      .expect(400);

    expect(response.body.message).toContain('Год должен быть');
  });

  test('должен вернуть ошибку при отрицательной цене', async () => {
    const carData = {
      brand: 'Toyota',
      model: 'Camry',
      year: '2020',
      price: '-1000'
    };

    const response = await request(app)
      .post('/api/cars/sell')
      .send(carData)
      .expect(400);

    expect(response.body.message).toContain('положительным числом');
  });

  test('должен создать автомобиль с минимальными данными', async () => {
    const carData = {
      brand: 'BMW',
      model: 'X5',
      year: '2021',
      price: '10000000'
    };

    const response = await request(app)
      .post('/api/cars/sell')
      .send(carData)
      .expect(201);

    expect(response.body.car).toBeDefined();
    expect(response.body.car.brand).toBe('BMW');
    expect(response.body.car.mileage).toBe(0);
  });
});
