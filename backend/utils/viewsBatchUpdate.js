const Car = require('../models/Car');

// Кэш для хранения счетчиков просмотров
const viewsCache = new Map();

/**
 * Увеличивает счетчик просмотров в кэше
 * @param {number} carId - ID автомобиля
 */
function incrementView(carId) {
  const currentViews = viewsCache.get(carId) || 0;
  viewsCache.set(carId, currentViews + 1);
}

/**
 * Пакетное обновление счетчиков просмотров в базе данных
 * Вызывается каждые 30 секунд
 */
async function batchUpdateViews() {
  if (viewsCache.size === 0) {
    return;
  }

  try {
    const updates = [];
    
    for (const [carId, viewsToAdd] of viewsCache.entries()) {
      updates.push(
        Car.increment('views', {
          by: viewsToAdd,
          where: { id: carId }
        })
      );
    }

    await Promise.all(updates);
    
    console.log(`[Views Batch Update] Обновлено ${viewsCache.size} автомобилей`);
    
    // Очищаем кэш после обновления
    viewsCache.clear();
  } catch (error) {
    console.error('[Views Batch Update] Ошибка обновления просмотров:', error);
  }
}

/**
 * Запускает периодическое обновление счетчиков просмотров
 */
function startViewsBatchUpdate() {
  // Обновляем каждые 30 секунд
  setInterval(batchUpdateViews, 30000);
  console.log('[Views Batch Update] Пакетное обновление просмотров запущено (каждые 30 секунд)');
}

/**
 * Получает текущее значение просмотров из кэша и БД
 * @param {number} carId - ID автомобиля
 * @returns {Promise<number>} - Текущее количество просмотров
 */
async function getCurrentViews(carId) {
  const cachedViews = viewsCache.get(carId) || 0;
  
  try {
    const car = await Car.findByPk(carId, { attributes: ['views'] });
    const dbViews = car ? (car.views || 0) : 0;
    return dbViews + cachedViews;
  } catch (error) {
    console.error('[Views Batch Update] Ошибка получения просмотров:', error);
    return cachedViews;
  }
}

module.exports = {
  incrementView,
  startViewsBatchUpdate,
  getCurrentViews
};
