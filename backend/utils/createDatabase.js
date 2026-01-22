const { Sequelize } = require('sequelize');
require('dotenv').config();

// Функция для создания базы данных, если её нет
const createDatabaseIfNotExists = async () => {
  const dbName = process.env.DB_NAME || 'authapp';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'postgres';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || 5432;

  // Подключаемся к базе данных postgres (системная база) для создания новой БД
  const adminSequelize = new Sequelize('postgres', dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'postgres',
    logging: false
  });

  try {
    await adminSequelize.authenticate();
    console.log('Подключение к PostgreSQL установлено');

    // Проверяем, существует ли база данных
    const [results] = await adminSequelize.query(
      `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`
    );

    if (results.length === 0) {
      // Создаем базу данных
      await adminSequelize.query(`CREATE DATABASE "${dbName}"`);
      console.log(`База данных "${dbName}" успешно создана`);
    } else {
      console.log(`База данных "${dbName}" уже существует`);
    }

    await adminSequelize.close();
    return true;
  } catch (error) {
    console.error('Ошибка при создании базы данных:', error.message);
    // Если база данных уже существует или другая ошибка, продолжаем
    if (error.message.includes('already exists')) {
      console.log(`База данных "${dbName}" уже существует`);
      await adminSequelize.close();
      return true;
    }
    await adminSequelize.close();
    return false;
  }
};

module.exports = createDatabaseIfNotExists;
