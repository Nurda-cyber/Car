import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchFavoritesCount();
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const fetchFavoritesCount = async () => {
    try {
      const response = await axios.get('/cars/favorites/list');
      setFavoritesCount(response.data.length);
    } catch (error) {
      console.error('Ошибка загрузки избранного:', error);
      setFavoritesCount(0);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
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

      const response = await axios.put('/auth/profile', updateData);
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
      confirmPassword: ''
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
                <div className="stat-card">
                  <div className="stat-icon">❤️</div>
                  <div className="stat-info">
                    <div className="stat-value">{loading ? '...' : favoritesCount}</div>
                    <div className="stat-label">Избранных автомобилей</div>
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
    </div>
  );
};

export default Profile;
