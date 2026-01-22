const sequelize = require('../config/database');

const DEFAULT_BALANCE = 5000000;

/**
 * Проверяет наличие столбца balance, при необходимости добавляет его.
 * Устанавливает balance = DEFAULT_BALANCE для пользователей с NULL или 0,
 * чтобы они могли совершать покупки.
 */
const ensureBalance = async () => {
  try {
    const [cols] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'balance';
    `);

    if (cols.length === 0) {
      await sequelize.query(`
        ALTER TABLE "users" 
        ADD COLUMN "balance" DECIMAL(10, 2) DEFAULT ${DEFAULT_BALANCE} NOT NULL;
      `);
      console.log('Столбец balance добавлен в таблицу users');
    }

    await sequelize.query(`
      UPDATE "users" 
      SET "balance" = ${DEFAULT_BALANCE} 
      WHERE "balance" IS NULL OR "balance" < 0.01;
    `);
  } catch (err) {
    console.error('Ошибка ensureBalance:', err.message);
    throw err;
  }
};

if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      await ensureBalance();
      await sequelize.close();
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  })();
}

module.exports = ensureBalance;
