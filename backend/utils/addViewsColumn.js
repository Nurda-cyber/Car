const sequelize = require('../config/database');

const addViewsColumn = async () => {
  try {
    // Проверяем, существует ли столбец views
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cars'
        AND column_name = 'views'
      );
    `);

    if (!results[0].exists) {
      // Добавляем столбец views
      await sequelize.query(`
        ALTER TABLE "cars" 
        ADD COLUMN "views" INTEGER NOT NULL DEFAULT 0;
      `);
      console.log('Столбец views добавлен в таблицу cars');
    } else {
      console.log('Столбец views уже существует');
    }
  } catch (error) {
    console.error('Ошибка добавления столбца views:', error.message);
  }
};

module.exports = addViewsColumn;
