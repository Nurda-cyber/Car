import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PriceDropAlert.css';

const PriceDropAlert = ({ car }) => {
  const [targetPrice, setTargetPrice] = useState('');
  const [existingAlert, setExistingAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchMyAlert();
  }, [car?.id]);

  const fetchMyAlert = async () => {
    if (!car?.id) return;
    
    try {
      const response = await axios.get('/api/price-alerts');
      const alert = response.data.find(a => a.carId === car.id && a.isActive);
      if (alert) {
        setExistingAlert(alert);
        setTargetPrice(alert.targetPrice.toString());
      }
    } catch (error) {
      console.error('Ошибка загрузки алерта:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!targetPrice || parseFloat(targetPrice) <= 0) {
      setMessage({ text: 'Введите корректную целевую цену', type: 'error' });
      return;
    }

    const targetPriceNum = parseFloat(targetPrice);
    if (targetPriceNum >= parseFloat(car.price)) {
      setMessage({ text: 'Целевая цена должна быть меньше текущей цены', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await axios.post('/api/price-alerts', {
        carId: car.id,
        targetPrice: targetPriceNum
      });

      setExistingAlert(response.data.alert);
      setMessage({ 
        text: existingAlert ? 'Алерт обновлен!' : 'Алерт создан! Вы получите уведомление, когда цена упадет.', 
        type: 'success' 
      });
      setShowForm(false);
      
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    } catch (error) {
      console.error('Ошибка создания алерта:', error);
      setMessage({ 
        text: error.response?.data?.message || 'Ошибка создания алерта', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingAlert) return;

    try {
      await axios.delete(`/api/price-alerts/${existingAlert.id}`);
      setExistingAlert(null);
      setTargetPrice('');
      setMessage({ text: 'Алерт удален', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error('Ошибка удаления алерта:', error);
      setMessage({ text: 'Ошибка удаления алерта', type: 'error' });
    }
  };

  if (!car) return null;

  return (
    <div className="price-drop-alert-container">
      <div className="alert-header">
        <h4><i className="bi bi-cash-coin" aria-hidden /> Уведомление о падении цены</h4>
        {existingAlert && (
          <span className="alert-active-badge">Активен</span>
        )}
      </div>

      {existingAlert ? (
        <div className="alert-info">
          <p>
            Вы будете уведомлены, когда цена упадет до{' '}
            <strong>{parseInt(existingAlert.targetPrice).toLocaleString('kk-KZ')} ₸</strong> или ниже.
          </p>
          <p className="current-price-info">
            Текущая цена: {parseInt(car.price).toLocaleString('kk-KZ')} ₸
          </p>
          <div className="alert-actions">
            <button 
              className="btn-edit-alert" 
              onClick={() => setShowForm(true)}
            >
              Изменить
            </button>
            <button 
              className="btn-delete-alert" 
              onClick={handleDelete}
            >
              Удалить
            </button>
          </div>
        </div>
      ) : (
        <p className="alert-description">
          Получите уведомление, когда цена на этот автомобиль упадет до указанной суммы.
        </p>
      )}

      {(showForm || !existingAlert) && (
        <form className="alert-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="targetPrice">
              Уведомить, когда цена упадет до (₸)
            </label>
            <input
              type="number"
              id="targetPrice"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder={`Макс: ${parseInt(car.price - 1).toLocaleString('kk-KZ')} ₸`}
              min="0"
              max={car.price - 1}
              step="1000"
              required
            />
            <small className="form-hint">
              Текущая цена: {parseInt(car.price).toLocaleString('kk-KZ')} ₸
            </small>
          </div>

          {message.text && (
            <div className={`alert-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-submit-alert" 
              disabled={loading}
            >
              {loading ? 'Сохранение...' : existingAlert ? 'Обновить алерт' : 'Создать алерт'}
            </button>
            {existingAlert && (
              <button 
                type="button" 
                className="btn-cancel-alert" 
                onClick={() => {
                  setShowForm(false);
                  setTargetPrice(existingAlert.targetPrice.toString());
                  setMessage({ text: '', type: '' });
                }}
              >
                Отмена
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default PriceDropAlert;
