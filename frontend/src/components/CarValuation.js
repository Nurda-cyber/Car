import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CarValuation.css';

const CarValuation = ({ carId }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [comment, setComment] = useState('');
  const [valuations, setValuations] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalValuations, setTotalValuations] = useState(0);
  const [myValuation, setMyValuation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchValuations();
    fetchMyValuation();
  }, [carId]);

  const fetchValuations = async () => {
    try {
      const response = await axios.get(`/api/valuations/car/${carId}`);
      setValuations(response.data.valuations);
      setAverageRating(parseFloat(response.data.averageRating));
      setTotalValuations(response.data.totalValuations);
    } catch (error) {
      console.error('Ошибка загрузки оценок:', error);
    }
  };

  const fetchMyValuation = async () => {
    try {
      const response = await axios.get(`/api/valuations/car/${carId}/my`);
      if (response.data) {
        setMyValuation(response.data);
        setRating(response.data.rating);
        setEstimatedPrice(response.data.estimatedPrice || '');
        setComment(response.data.comment || '');
      }
    } catch (error) {
      console.error('Ошибка загрузки моей оценки:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setMessage({ text: 'Пожалуйста, выберите рейтинг', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await axios.post('/api/valuations', {
        carId,
        rating,
        estimatedPrice: estimatedPrice || null,
        comment: comment.trim() || null
      });

      setMessage({ text: myValuation ? 'Оценка обновлена!' : 'Оценка добавлена!', type: 'success' });
      fetchValuations();
      fetchMyValuation();
      
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error('Ошибка сохранения оценки:', error);
      setMessage({ text: 'Ошибка сохранения оценки', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (value, interactive = false) => {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= (interactive ? hoveredRating || rating : value);
          return (
            <span
              key={star}
              className={`star ${isFilled ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
              onMouseEnter={() => interactive && setHoveredRating(star)}
              onMouseLeave={() => interactive && setHoveredRating(0)}
              onClick={() => interactive && setRating(star)}
            >
              ⭐
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="car-valuation-container">
      <h3 className="valuation-title">⭐ Оценка автомобиля</h3>

      {totalValuations > 0 && (
        <div className="valuation-summary">
          <div className="average-rating">
            <span className="average-rating-value">{averageRating.toFixed(1)}</span>
            <span className="average-rating-stars">{renderStars(Math.round(averageRating))}</span>
            <span className="total-valuations">({totalValuations} оценок)</span>
          </div>
        </div>
      )}

      <form className="valuation-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Ваш рейтинг *</label>
          {renderStars(rating, true)}
        </div>

        <div className="form-group">
          <label htmlFor="estimatedPrice">Ваша оценка цены (₸)</label>
          <input
            type="number"
            id="estimatedPrice"
            value={estimatedPrice}
            onChange={(e) => setEstimatedPrice(e.target.value)}
            placeholder="Например: 5000000"
            min="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="comment">Комментарий</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ваше мнение об автомобиле..."
            rows="4"
          />
        </div>

        {message.text && (
          <div className={`valuation-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <button type="submit" className="submit-valuation" disabled={loading}>
          {loading ? 'Сохранение...' : myValuation ? 'Обновить оценку' : 'Отправить оценку'}
        </button>
      </form>

      {valuations.length > 0 && (
        <div className="valuations-list">
          <h4>Все оценки ({totalValuations})</h4>
          {valuations.map((valuation) => (
            <div key={valuation.id} className="valuation-item">
              <div className="valuation-item-header">
                <span className="valuation-user">{valuation.user?.name || 'Пользователь'}</span>
                <span className="valuation-date">
                  {new Date(valuation.createdAt).toLocaleDateString('kk-KZ')}
                </span>
              </div>
              <div className="valuation-rating">{renderStars(valuation.rating)}</div>
              {valuation.estimatedPrice && (
                <div className="valuation-price">
                  Оценка цены: {parseInt(valuation.estimatedPrice).toLocaleString('kk-KZ')} ₸
                </div>
              )}
              {valuation.comment && (
                <div className="valuation-comment">{valuation.comment}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CarValuation;
