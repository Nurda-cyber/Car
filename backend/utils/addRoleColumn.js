const sequelize = require('../config/database');

// Скрипт для добавления столбца role в таблицу users
const addRoleColumn = async () => {
  try {
    // Проверяем, существует ли столбец role
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='role';
    `);

    if (results.length === 0) {
      // Создаем ENUM тип если его нет
      await sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_users_role" AS ENUM ('user', 'admin');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      
      // Добавляем столбец role с типом ENUM
      await sequelize.query(`
        ALTER TABLE "users" 
        ADD COLUMN "role" "enum_users_role" DEFAULT 'user' NOT NULL;
      `);
      
      console.log('Столбец role успешно добавлен в таблицу users');
    } else {
      console.log('Столбец role уже существует');
    }
  } catch (error) {
    console.error('Ошибка при добавлении столбца role:', error.message);
    throw error;
  }
};

// Запускаем скрипт, если он вызван напрямую
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('Подключение к базе данных установлено');
      await addRoleColumn();
      await sequelize.close();
      process.exit(0);
    } catch (error) {
      console.error('Ошибка:', error);
      await sequelize.close();
      process.exit(1);
    }
  })();
}

module.exports = addRoleColumn;
