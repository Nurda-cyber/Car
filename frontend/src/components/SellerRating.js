import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SellerRating.css';

const SellerRating = ({ sellerId, sellerName }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [myRating, setMyRating] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (sellerId) {
      fetchRatings();
      fetchMyRating();
    }
  }, [sellerId]);

  const fetchRatings = async () => {
    try {
      // Получаем общую статистику (average и total)
      const statsResponse = await axios.get(`/api/ratings/${sellerId}`);
      setAverageRating(statsResponse.data.average);
      setTotalRatings(statsResponse.data.total);
      
      // Получаем детальный список рейтингов
      const detailsResponse = await axios.get(`/api/ratings/seller/${sellerId}`);
      setRatings(detailsResponse.data.ratings);
    } catch (error) {
      console.error('Ошибка загрузки рейтингов:', error);
    }
  };

  const fetchMyRating = async () => {
    try {
      const response = await axios.get(`/api/ratings/seller/${sellerId}/my`);
      if (response.data) {
        setMyRating(response.data);
        setRating(response.data.rating);
        setComment(response.data.comment || '');
      }
    } catch (error) {
      console.error('Ошибка загрузки моего рейтинга:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (rating === 0) {
      setMessage({ text: 'Пожалуйста, выберите рейтинг', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await axios.post(`/api/ratings/${sellerId}`, {
        rating,
        comment: comment.trim() || null
      });

      setMessage({ text: myRating ? 'Рейтинг обновлен!' : 'Рейтинг добавлен!', type: 'success' });
      fetchRatings();
      fetchMyRating();
      
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error('Ошибка сохранения рейтинга:', error);
      setMessage({ 
        text: error.response?.data?.message || 'Ошибка сохранения рейтинга', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (value, interactive = false) => {
    return (
      <div className="stars-container" onClick={(e) => e.stopPropagation()}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= (interactive ? hoveredRating || rating : value);
          return (
            <span
              key={star}
              className={`star ${isFilled ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
              onMouseEnter={(e) => {
                e.stopPropagation();
                if (interactive) setHoveredRating(star);
              }}
              onMouseLeave={(e) => {
                e.stopPropagation();
                if (interactive) setHoveredRating(0);
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (interactive) setRating(star);
              }}
            >
              ⭐
            </span>
          );
        })}
      </div>
    );
  };

  if (!sellerId) {
    return (
      <div className="seller-rating-container">
        <h3 className="rating-title">⭐ Рейтинг продавца</h3>
        <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
          Информация о продавце недоступна
        </p>
      </div>
    );
  }

  return (
    <div className="seller-rating-container" onClick={(e) => e.stopPropagation()}>
      <h3 className="rating-title">⭐ Рейтинг продавца: {sellerName || 'Продавец'}</h3>

      {totalRatings > 0 ? (
        <div className="rating-summary">
          <div className="average-rating">
            <span className="average-rating-value">{averageRating.toFixed(1)}</span>
            <span className="average-rating-stars">{renderStars(Math.round(averageRating))}</span>
            <span className="total-ratings">({totalRatings} оценок)</span>
          </div>
        </div>
      ) : (
        <div className="rating-summary" style={{ background: '#f8f8f8', color: '#666' }}>
          <p style={{ margin: 0, padding: '12px' }}>Пока нет оценок. Будьте первым, кто оценит этого продавца!</p>
        </div>
      )}

      <form className="rating-form" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <div className="form-group">
          <label>Ваш рейтинг *</label>
          {renderStars(rating, true)}
        </div>

        <div className="form-group">
          <label htmlFor="comment">Комментарий</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ваше мнение о продавце..."
            rows="4"
          />
        </div>

        {message.text && (
          <div className={`rating-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <button type="submit" className="submit-rating" disabled={loading}>
          {loading ? 'Сохранение...' : myRating ? 'Обновить рейтинг' : 'Отправить рейтинг'}
        </button>
      </form>

      {ratings.length > 0 && (
        <div className="ratings-list">
          <h4>Все оценки ({totalRatings})</h4>
          {ratings.map((ratingItem) => (
            <div key={ratingItem.id} className="rating-item">
              <div className="rating-item-header">
                <span className="rating-user">{ratingItem.user?.name || 'Пользователь'}</span>
                <span className="rating-date">
                  {new Date(ratingItem.createdAt).toLocaleDateString('kk-KZ')}
                </span>
              </div>
              <div className="rating-rating">{renderStars(ratingItem.rating)}</div>
              {ratingItem.comment && (
                <div className="rating-comment">{ratingItem.comment}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerRating;
