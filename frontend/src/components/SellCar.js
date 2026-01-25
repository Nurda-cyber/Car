import React, { useState } from 'react';
import axios from 'axios';
import './SellCar.css';

const SellCar = () => {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    price: '',
    mileage: '0',
    color: '',
    engine: '',
    transmission: '',
    fuelType: '',
    description: '',
    city: '',
    photos: []
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      setError('Можно загрузить максимум 10 фотографий');
      return;
    }

    // Проверка размера файлов
    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError('Размер каждого файла не должен превышать 5MB');
      return;
    }

    // Проверка типа файлов
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidTypes = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidTypes.length > 0) {
      setError('Разрешены только изображения (jpeg, jpg, png, gif, webp)');
      return;
    }

    setSelectedFiles(files);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Валидация
    if (!formData.brand || !formData.model || !formData.year || !formData.price) {
      setError('Заполните все обязательные поля: марка, модель, год, цена');
      setLoading(false);
      return;
    }

    const yearNum = parseInt(formData.year);
    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      setError(`Год должен быть от 1900 до ${currentYear + 1}`);
      setLoading(false);
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Цена должна быть положительным числом');
      setLoading(false);
      return;
    }

    const mileageNum = parseInt(formData.mileage);
    if (isNaN(mileageNum) || mileageNum < 0) {
      setError('Пробег должен быть неотрицательным числом');
      setLoading(false);
      return;
    }

    try {
      // Создаем FormData для отправки файлов
      const formDataToSend = new FormData();
      formDataToSend.append('brand', formData.brand);
      formDataToSend.append('model', formData.model);
      formDataToSend.append('year', formData.year);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('mileage', formData.mileage || '0');
      if (formData.color) formDataToSend.append('color', formData.color);
      if (formData.engine) formDataToSend.append('engine', formData.engine);
      if (formData.transmission) formDataToSend.append('transmission', formData.transmission);
      if (formData.fuelType) formDataToSend.append('fuelType', formData.fuelType);
      if (formData.description) formDataToSend.append('description', formData.description);
      if (formData.city) formDataToSend.append('city', formData.city);

      // Добавляем файлы
      selectedFiles.forEach((file) => {
        formDataToSend.append('photos', file);
      });

      const response = await axios.post('/cars/sell', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(response.data.message || 'Объявление успешно создано и отправлено на модерацию');
      
      // Очищаем форму
      setFormData({
        brand: '',
        model: '',
        year: '',
        price: '',
        mileage: '0',
        color: '',
        engine: '',
        transmission: '',
        fuelType: '',
        description: '',
        city: '',
        photos: []
      });
      setSelectedFiles([]);
      
      // Очищаем input файлов
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Ошибка создания объявления:', error);
      setError(error.response?.data?.message || 'Ошибка создания объявления');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sell-car-container">
      <div className="sell-car-header">
        <h1>Продать автомобиль</h1>
        <p className="sell-car-subtitle">Заполните форму для размещения объявления о продаже автомобиля</p>
      </div>

      <div className="sell-car-content">
        {error && (
          <div className="sell-car-message sell-car-error">
            {error}
          </div>
        )}
        {success && (
          <div className="sell-car-message sell-car-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="sell-car-form">
          <div className="form-section">
            <h2>Основная информация</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="brand">Марка *</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                  placeholder="Например: Toyota"
                />
              </div>

              <div className="form-group">
                <label htmlFor="model">Модель *</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                  placeholder="Например: Camry"
                />
              </div>

              <div className="form-group">
                <label htmlFor="year">Год выпуска *</label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  placeholder="2020"
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">Цена (₸) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="5000000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="mileage">Пробег (км)</label>
                <input
                  type="number"
                  id="mileage"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="50000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="color">Цвет</label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  placeholder="Например: Черный"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Технические характеристики</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="engine">Двигатель</label>
                <input
                  type="text"
                  id="engine"
                  name="engine"
                  value={formData.engine}
                  onChange={handleInputChange}
                  placeholder="Например: 2.0L"
                />
              </div>

              <div className="form-group">
                <label htmlFor="transmission">Коробка передач</label>
                <select
                  id="transmission"
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleInputChange}
                >
                  <option value="">Выберите</option>
                  <option value="manual">Механическая</option>
                  <option value="automatic">Автоматическая</option>
                  <option value="cvt">Вариатор</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="fuelType">Тип топлива</label>
                <select
                  id="fuelType"
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleInputChange}
                >
                  <option value="">Выберите</option>
                  <option value="petrol">Бензин</option>
                  <option value="diesel">Дизель</option>
                  <option value="electric">Электрический</option>
                  <option value="hybrid">Гибрид</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="city">Город</label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
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
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Описание</h2>
            <div className="form-group full-width">
              <label htmlFor="description">Описание автомобиля</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="5"
                placeholder="Опишите состояние автомобиля, особенности, историю обслуживания и т.д."
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Фотографии</h2>
            <div className="form-group full-width">
              <label htmlFor="photos">Загрузить фотографии (максимум 10, до 5MB каждая)</label>
              <input
                type="file"
                id="photos"
                name="photos"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                multiple
                onChange={handleFileChange}
              />
              {selectedFiles.length > 0 && (
                <div className="selected-files">
                  <p>Выбрано файлов: {selectedFiles.length}</p>
                  <ul>
                    {selectedFiles.map((file, index) => (
                      <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Отправка...' : 'Разместить объявление'}
            </button>
            <button 
              type="button" 
              className="btn-reset" 
              onClick={() => {
                setFormData({
                  brand: '',
                  model: '',
                  year: '',
                  price: '',
                  mileage: '0',
                  color: '',
                  engine: '',
                  transmission: '',
                  fuelType: '',
                  description: '',
                  city: '',
                  photos: []
                });
                setSelectedFiles([]);
                setError('');
                setSuccess('');
                const fileInput = document.querySelector('input[type="file"]');
                if (fileInput) {
                  fileInput.value = '';
                }
              }}
            >
              Очистить форму
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellCar;
