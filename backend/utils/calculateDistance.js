// Координаты крупных городов Казахстана
const cityCoordinates = {
  'Алматы': { lat: 43.2220, lon: 76.8512 },
  'Астана': { lat: 51.1694, lon: 71.4491 },
  'Шымкент': { lat: 42.3419, lon: 69.5901 },
  'Караганда': { lat: 49.8014, lon: 73.1049 },
  'Актобе': { lat: 50.2833, lon: 57.1667 },
  'Тараз': { lat: 42.9000, lon: 71.3667 },
  'Павлодар': { lat: 52.2833, lon: 76.9667 },
  'Усть-Каменогорск': { lat: 49.9667, lon: 82.6167 },
  'Семей': { lat: 50.4111, lon: 80.2275 },
  'Атырау': { lat: 47.1167, lon: 51.8833 },
  'Кызылорда': { lat: 44.8479, lon: 65.4999 },
  'Уральск': { lat: 51.2333, lon: 51.3667 },
  'Костанай': { lat: 53.2144, lon: 63.6246 },
  'Петропавловск': { lat: 54.8667, lon: 69.1500 },
  'Актау': { lat: 43.6500, lon: 51.1500 },
  'Темиртау': { lat: 50.0547, lon: 72.9646 },
  'Туркестан': { lat: 43.3011, lon: 68.2542 },
  'Кокшетау': { lat: 53.2833, lon: 69.3833 },
  'Экибастуз': { lat: 51.7167, lon: 75.3167 },
  'Рудный': { lat: 52.9667, lon: 63.1167 }
};

// Функция расчета расстояния между двумя точками по формуле гаверсинуса (в км)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Радиус Земли в километрах
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Получить координаты города
function getCityCoordinates(cityName) {
  return cityCoordinates[cityName] || null;
}

// Рассчитать расстояние от города пользователя до автомобиля
function calculateDistanceFromCity(userCity, carLat, carLon) {
  if (!userCity || !carLat || !carLon) {
    return null;
  }

  const userCoords = getCityCoordinates(userCity);
  if (!userCoords) {
    return null;
  }

  return calculateDistance(userCoords.lat, userCoords.lon, parseFloat(carLat), parseFloat(carLon));
}

module.exports = {
  calculateDistance,
  getCityCoordinates,
  calculateDistanceFromCity,
  cityCoordinates
};
