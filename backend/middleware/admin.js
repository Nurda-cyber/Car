const auth = require('./auth');

// Middleware для проверки прав администратора
const admin = (req, res, next) => {
  // Сначала проверяем авторизацию
  auth(req, res, () => {
    // Проверяем роль пользователя
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора' });
    }
    next();
  });
};

module.exports = admin;
