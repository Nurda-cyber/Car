import React, { useState, useContext } from 'react';
import axios from 'axios';
import LanguageContext from '../context/LanguageContext';
import './SellCar.css';

const SellCar = () => {
  const { t } = useContext(LanguageContext);
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
    if (files.length > 5) {
      setError(t('sell.maxPhotos'));
      return;
    }

    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError(t('sell.maxFileSize'));
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidTypes = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidTypes.length > 0) {
      setError(t('sell.allowedImages'));
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

    if (!formData.brand || !formData.model || !formData.year || !formData.price) {
      setError(t('sell.fillRequired'));
      setLoading(false);
      return;
    }

    const yearNum = parseInt(formData.year);
    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      setError(`${t('sell.yearRange')} ${currentYear + 1}`);
      setLoading(false);
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError(t('sell.pricePositive'));
      setLoading(false);
      return;
    }

    const mileageNum = parseInt(formData.mileage);
    if (isNaN(mileageNum) || mileageNum < 0) {
      setError(t('sell.mileageNonNegative'));
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

      const response = await axios.post('/api/cars/sell', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(response.data.message || t('sell.successMessage'));
      
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
      setError(error.response?.data?.message || t('sell.errorCreate'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sell-car-container">
      <div className="sell-car-header">
        <h1>{t('sell.title')}</h1>
        <p className="sell-car-subtitle">{t('sell.subtitle')}</p>
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
            <h2>{t('sell.mainInfo')}</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="brand">{t('sell.brandRequired')}</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                  placeholder={t('sell.placeholderBrand')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="model">{t('sell.modelRequired')}</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                  placeholder={t('sell.placeholderModel')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="year">{t('sell.yearRequired')}</label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  placeholder={t('sell.placeholderYear')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">{t('sell.priceRequired')}</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder={t('sell.placeholderPrice')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="mileage">{t('sell.mileageLabel')}</label>
                <input
                  type="number"
                  id="mileage"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleInputChange}
                  min="0"
                  placeholder={t('sell.placeholderMileage')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="color">{t('sell.colorLabel')}</label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  placeholder={t('sell.placeholderColor')}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>{t('sell.techSpecs')}</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="engine">{t('sell.engineLabel')}</label>
                <input
                  type="text"
                  id="engine"
                  name="engine"
                  value={formData.engine}
                  onChange={handleInputChange}
                  placeholder={t('sell.placeholderEngine')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="transmission">{t('sell.transmissionLabel')}</label>
                <select
                  id="transmission"
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleInputChange}
                >
                  <option value="">{t('common.select')}</option>
                  <option value="manual">{t('cars.manual')}</option>
                  <option value="automatic">{t('cars.automatic')}</option>
                  <option value="cvt">{t('cars.cvt')}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="fuelType">{t('sell.fuelLabel')}</label>
                <select
                  id="fuelType"
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleInputChange}
                >
                  <option value="">{t('common.select')}</option>
                  <option value="petrol">{t('cars.petrol')}</option>
                  <option value="diesel">{t('cars.diesel')}</option>
                  <option value="electric">{t('cars.electric')}</option>
                  <option value="hybrid">{t('cars.hybrid')}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="city">{t('sell.cityLabel')}</label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                >
                  <option value="">{t('profile.selectCity')}</option>
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
            <h2>{t('cars.description')}</h2>
            <div className="form-group full-width">
              <label htmlFor="description">{t('sell.descriptionLabel')}</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="5"
                placeholder={t('sell.descriptionPlaceholder')}
              />
            </div>
          </div>

          <div className="form-section">
            <h2>{t('sell.photosSection')}</h2>
            <div className="form-group full-width">
              <label htmlFor="photos">{t('sell.photosLabel')}</label>
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
                  <p>{t('sell.filesSelected')} {selectedFiles.length}</p>
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
              {loading ? t('sell.submitting') : t('sell.submitBtn')}
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
              {t('sell.clearForm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellCar;
