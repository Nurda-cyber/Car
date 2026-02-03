import React, { useContext, useState, useEffect } from 'react';
import { API_BASE } from '../config';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [favoritesList, setFavoritesList] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [purchasesCount, setPurchasesCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    bankCard: '',
    city: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchFavoritesCount();
    fetchPurchaseHistory();
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        bankCard: user.bankCard || '',
        city: user.city || ''
      });
    }
  }, [user]);

  const fetchFavoritesCount = async () => {
    try {
      const response = await axios.get('/api/cars/favorites/list');
      setFavoritesCount(response.data.length);
      setFavoritesList(response.data);
    } catch (error) {
      console.error('Ошибка загрузки избранного:', error);
      setFavoritesCount(0);
      setFavoritesList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseHistory = async () => {
    try {
      const response = await axios.get('/api/auth/purchase-history');
      setPurchaseHistory(response.data);
      setPurchasesCount(response.data.length);
    } catch (error) {
      console.error('Ошибка загрузки истории покупок:', error);
      setPurchaseHistory([]);
      setPurchasesCount(0);
    }
  };

  const handleFavoritesClick = () => {
    setShowFavorites(!showFavorites);
    if (!showFavorites) {
      fetchFavoritesCount();
    }
  };

  const handleHistoryClick = () => {
    setShowHistory(!showHistory);
    if (!showHistory) {
      fetchPurchaseHistory();
    }
  };

  const removeFromFavorites = async (carId) => {
    try {
      await axios.delete(`/api/cars/${carId}/favorite`);
      setFavoritesList(favoritesList.filter(car => car.id !== carId));
      setFavoritesCount(favoritesCount - 1);
    } catch (error) {
      console.error('Ошибка удаления из избранного:', error);
      alert(error.response?.data?.message || 'Ошибка удаления из избранного');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleDateString('kk-KZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Валидация
    if (!formData.name || !formData.email) {
      setError('Имя и email обязательны для заполнения');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    try {
      const updateData = {
        name: formData.name,
        email: formData.email
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      // Обработка банковской карты - убираем пробелы только один раз
      if (formData.bankCard !== undefined) {
        const cardNumber = formData.bankCard.replace(/\s/g, ''); // Убираем пробелы
        if (cardNumber && (cardNumber.length < 16 || cardNumber.length > 19)) {
          setError('Номер карты должен содержать от 16 до 19 цифр');
          return;
        }
        updateData.bankCard = cardNumber || '';
      }

      if (formData.city !== undefined) {
        updateData.city = formData.city || '';
      }

      const response = await axios.put('/api/auth/profile', updateData);
      updateUser(response.data.user);
      setSuccess('Профиль успешно обновлен');
      setIsEditing(false);
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка обновления профиля');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      confirmPassword: '',
      bankCard: user?.bankCard || '',
      city: user?.city || ''
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Мой профиль</h1>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="role-badge">
              {user?.role === 'admin' ? '👑 Администратор' : '👤 Пользователь'}
            </div>
          </div>

          <div className="profile-info">
            <div className="info-section">
              <div className="section-header">
                <h2>Личная информация</h2>
                {!isEditing && (
                  <button
                    className="btn-edit-profile"
                    onClick={() => setIsEditing(true)}
                  >
                    ✏️ Редактировать
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="profile-form">
                  {error && <div className="alert alert-error">{error}</div>}
                  {success && <div className="alert alert-success">{success}</div>}
                  
                  <div className="form-group">
                    <label htmlFor="name">Имя *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Новый пароль (оставьте пустым, если не хотите менять)</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Минимум 6 символов"
                    />
                  </div>

                  {formData.password && (
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Подтвердите пароль</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Повторите пароль"
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="bankCard">Банковская карта</label>
                    <input
                      type="text"
                      id="bankCard"
                      name="bankCard"
                      value={formData.bankCard}
                      onChange={(e) => {
                        // Форматирование номера карты (группы по 4 цифры)
                        const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                        const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                        setFormData(prev => ({ ...prev, bankCard: formatted }));
                        setError('');
                        setSuccess('');
                      }}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                    <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      Введите номер карты (16-19 цифр)
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="city">Город</label>
                    <select
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="">Выберите город</option>
                      <option value="Алматы">Алматы</option>
                      <option value="Астана">Астана</option>
                      <option value="Шымкент">Шымкент</option>
                      <option value="Караганда">Караганда</option>
                      <option value="Актобе">Актобе</option>
                      <option value="Тараз">Тараз</option>
                      <option value="Павлодар">Павлодар</option>
                      <option value="Усть-Каменогорск">Усть-Каменогорск</option>
                      <option value="Семей">Семей</option>
                      <option value="Атырау">Атырау</option>
                      <option value="Кызылорда">Кызылорда</option>
                      <option value="Уральск">Уральск</option>
                      <option value="Костанай">Костанай</option>
                      <option value="Петропавловск">Петропавловск</option>
                      <option value="Актау">Актау</option>
                      <option value="Темиртау">Темиртау</option>
                      <option value="Туркестан">Туркестан</option>
                      <option value="Кокшетау">Кокшетау</option>
                      <option value="Экибастуз">Экибастуз</option>
                      <option value="Рудный">Рудный</option>
                    </select>
                    <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      Выберите город Казахстана для расчета расстояния до автомобилей
                    </small>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-save">
                      Сохранить
                    </button>
                    <button type="button" onClick={handleCancel} className="btn-cancel">
                      Отмена
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="info-item">
                    <span className="info-label">Имя:</span>
                    <span className="info-value">{user?.name || 'Не указано'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{user?.email || 'Не указано'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Роль:</span>
                    <span className="info-value">
                      {user?.role === 'admin' ? 'Администратор' : 'Пользователь'}
                    </span>
                  </div>
                  {user?.bankCard && (
                    <div className="info-item">
                      <span className="info-label">Банковская карта:</span>
                      <span className="info-value bank-card-value">
                        {user.bankCard.replace(/(.{4})/g, '$1 ').trim()}
                      </span>
                    </div>
                  )}
                  {user?.city && (
                    <div className="info-item">
                      <span className="info-label">Город:</span>
                      <span className="info-value city-value">📍 {user.city}</span>
                    </div>
                  )}
                  {user?.createdAt && (
                    <div className="info-item">
                      <span className="info-label">Дата регистрации:</span>
                      <span className="info-value">{formatDate(user.createdAt)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="info-section">
              <h2>Статистика</h2>
              <div className="stats-grid">
                <div className="stat-card stat-card-clickable" onClick={handleFavoritesClick}>
                  <div className="stat-icon">❤️</div>
                  <div className="stat-info">
                    <div className="stat-value">{loading ? '...' : favoritesCount}</div>
                    <div className="stat-label">Избранных автомобилей</div>
                    <div className="stat-hint">Нажмите, чтобы посмотреть</div>
                  </div>
                </div>
                <div className="stat-card stat-card-clickable" onClick={handleHistoryClick}>
                  <div className="stat-icon">🛒</div>
                  <div className="stat-info">
                    <div className="stat-value">{purchasesCount}</div>
                    <div className="stat-label">Купленных автомобилей</div>
                    <div className="stat-hint">Нажмите, чтобы посмотреть</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-info">
                    <div className="stat-value">
                      {user?.createdAt 
                        ? Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
                        : '0'}
                    </div>
                    <div className="stat-label">Дней с нами</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFavorites && (
        <div className="favorites-modal">
          <div className="favorites-modal-content">
            <div className="favorites-modal-header">
              <h2>❤️ Избранные автомобили</h2>
              <button className="favorites-modal-close" onClick={() => setShowFavorites(false)}>×</button>
            </div>
            <div className="favorites-list">
              {favoritesList.length === 0 ? (
                <div className="favorites-empty">
                  <p>У вас пока нет избранных автомобилей</p>
                </div>
              ) : (
                <div className="favorites-grid">
                  {favoritesList.map(car => (
                    <div key={car.id} className="favorite-car-card">
                      <div className="favorite-car-image">
                        {car.photos && car.photos.length > 0 ? (
                          <img 
                            src={`${API_BASE}${car.photos[0]}`} 
                            alt={`${car.brand} ${car.model}`} 
                          />
                        ) : (
                          <div className="no-image">Нет фото</div>
                        )}
                        <button
                          className="favorite-remove-btn"
                          onClick={() => removeFromFavorites(car.id)}
                          title="Удалить из избранного"
                        >
                          ❌
                        </button>
                      </div>
                      <div className="favorite-car-info">
                        <h3>{car.brand} {car.model}</h3>
                        <p className="favorite-car-year">{car.year} год</p>
                        <p className="favorite-car-price">{parseInt(car.price).toLocaleString('kk-KZ')} ₸</p>
                        {car.mileage && (
                          <p className="favorite-car-mileage">Пробег: {car.mileage.toLocaleString('kk-KZ')} км</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="favorites-modal">
          <div className="favorites-modal-content">
            <div className="favorites-modal-header">
              <h2>🛒 История покупок</h2>
              <button className="favorites-modal-close" onClick={() => setShowHistory(false)}>×</button>
            </div>
            <div className="favorites-list">
              {purchaseHistory.length === 0 ? (
                <div className="favorites-empty">
                  <p>У вас пока нет покупок</p>
                </div>
              ) : (
                <div className="favorites-grid">
                  {purchaseHistory.map(purchase => (
                    <div key={purchase.id} className="favorite-car-card">
                      <div className="favorite-car-image">
                        {purchase.car && purchase.car.photos && purchase.car.photos.length > 0 ? (
                          <img 
                            src={`${API_BASE}${purchase.car.photos[0]}`} 
                            alt={`${purchase.car.brand} ${purchase.car.model}`} 
                          />
                        ) : (
                          <div className="no-image">Нет фото</div>
                        )}
                        <div className="purchase-badge">✓ Куплено</div>
                      </div>
                      <div className="favorite-car-info">
                        {purchase.car ? (
                          <>
                            <h3>{purchase.car.brand} {purchase.car.model}</h3>
                            <p className="favorite-car-year">{purchase.car.year} год</p>
                            <p className="favorite-car-price">{parseInt(purchase.price).toLocaleString('kk-KZ')} ₸</p>
                            {purchase.car.mileage && (
                              <p className="favorite-car-mileage">Пробег: {purchase.car.mileage.toLocaleString('kk-KZ')} км</p>
                            )}
                            {purchase.car.city && (
                              <p className="favorite-car-city">📍 {purchase.car.city}</p>
                            )}
                            <p className="purchase-date">Дата покупки: {formatDate(purchase.purchaseDate)}</p>
                          </>
                        ) : (
                          <p>Автомобиль удален</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
