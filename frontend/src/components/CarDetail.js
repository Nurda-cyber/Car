import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import LanguageContext from '../context/LanguageContext';
import { API_BASE } from '../config';
import ShareButton from './ShareButton';
import CarValuation from './CarValuation';
import PriceDropAlert from './PriceDropAlert';
import Chat from './Chat';
import SellerRating from './SellerRating';
import './CarDetail.css';

const CarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const [car, setCar] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    fetchCar();
  }, [id]);

  const fetchCar = async () => {
    try {
      setLoading(true);
      console.log(`[CarDetail] Загрузка автомобиля с ID: ${id}`);
      const response = await axios.get(`/api/cars/${id}`);
      console.log(`[CarDetail] Автомобиль загружен:`, response.data);
      setCar(response.data);
      
      // Используем информацию о продавце из ответа API
      if (response.data.seller) {
        setSeller(response.data.seller);
      } else if (response.data.sellerId) {
        // Если seller не включен, но есть sellerId, загружаем отдельно
        try {
          const sellerResponse = await axios.get(`/api/auth/user/${response.data.sellerId}`);
          setSeller(sellerResponse.data);
        } catch (err) {
          console.error('Ошибка загрузки продавца:', err);
        }
      }
    } catch (error) {
      console.error(`[CarDetail] Ошибка загрузки автомобиля ${id}:`, error);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      if (error.response?.status === 404) {
        // Автомобиль не найден - это нормально, состояние car останется null
        console.log(`[CarDetail] Автомобиль ${id} не найден (404)`);
      } else {
        // Другие ошибки - показываем сообщение
        console.error('Ошибка:', error.response?.data?.message || error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="car-detail-loading">{t('common.loading')}</div>;
  }

  if (!car && !loading) {
    return (
      <div className="car-detail-error">
        <p>{t('cars.carNotFound')}</p>
        <p style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
          {t('cars.carNotFoundHint')}
        </p>
        <button onClick={() => navigate('/dashboard')}>{t('cars.backToCatalog')}</button>
      </div>
    );
  }

  const isMyCar = car.sellerId === user?.id;

  return (
    <div className="car-detail-container">
      <button className="back-button" onClick={() => navigate('/dashboard')}>
        ← {t('cars.backToCatalog')}
      </button>

      <div className="car-detail-content">
        <div className="car-detail-main">
          <div className="car-detail-header">
            <div>
              <h1>{car.brand} {car.model}</h1>
              {car.views !== undefined && (
                <p className="car-views">👁️ {t('cars.views')}: {car.views.toLocaleString('kk-KZ')}</p>
              )}
            </div>
            <div className="car-detail-actions">
              <ShareButton car={car} />
              {!isMyCar ? (
                <button 
                  className="chat-button"
                  onClick={() => setShowChat(!showChat)}
                >
                  💬 {showChat ? t('cars.closeChat') : t('cars.writeToSeller')}
                </button>
              ) : (
                <button
                  className="chat-button"
                  onClick={() => navigate('/dashboard', { state: { activeTab: 'chats' } })}
                >
                  💬 {t('cars.openChatsForCar')}
                </button>
              )}
            </div>
          </div>

          <div className="car-detail-gallery">
            {car.photos && car.photos.length > 0 ? (
              <div className="car-photos">
                {car.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={`${API_BASE}${photo}`}
                    alt={`${car.brand} ${car.model} - фото ${index + 1}`}
                    className="car-photo"
                  />
                ))}
              </div>
            ) : (
              <div className="no-photos">🚗 {t('cars.noPhotos')}</div>
            )}
          </div>

          <div className="car-detail-info">
            <div className="info-section">
              <h3>{t('cars.mainInfo')}</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">{t('cars.yearLabel')}:</span>
                  <span className="info-value">{car.year}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t('cars.priceLabel')}:</span>
                  <span className="info-value price">{parseInt(car.price).toLocaleString('kk-KZ')} ₸</span>
                </div>
                {car.mileage !== undefined && (
                  <div className="info-item">
                    <span className="info-label">{t('cars.mileageLabel')}:</span>
                    <span className="info-value">{car.mileage.toLocaleString('kk-KZ')} км</span>
                  </div>
                )}
                {car.color && (
                  <div className="info-item">
                    <span className="info-label">{t('cars.colorLabel')}:</span>
                    <span className="info-value">{car.color}</span>
                  </div>
                )}
                {car.transmission && (
                  <div className="info-item">
                    <span className="info-label">{t('cars.transmission')}:</span>
                    <span className="info-value">
                      {car.transmission === 'manual' ? t('cars.manual') :
                       car.transmission === 'automatic' ? t('cars.automatic') : t('cars.cvt')}
                    </span>
                  </div>
                )}
                {car.fuelType && (
                  <div className="info-item">
                    <span className="info-label">{t('cars.fuel')}:</span>
                    <span className="info-value">
                      {car.fuelType === 'petrol' ? t('cars.petrol') :
                       car.fuelType === 'diesel' ? t('cars.diesel') :
                       car.fuelType === 'electric' ? t('cars.electric') : t('cars.hybrid')}
                    </span>
                  </div>
                )}
                {car.city && (
                  <div className="info-item">
                    <span className="info-label">{t('cars.city')}:</span>
                    <span className="info-value">{car.city}</span>
                  </div>
                )}
              </div>
            </div>

            {car.description && (
              <div className="info-section">
                <h3>{t('cars.description')}</h3>
                <p className="car-description">{car.description}</p>
              </div>
            )}
          </div>

          {!isMyCar && (
            <div className="car-detail-alerts" onClick={(e) => e.stopPropagation()}>
              <PriceDropAlert car={car} />
            </div>
          )}

          <div className="car-detail-valuation" onClick={(e) => e.stopPropagation()}>
            <CarValuation carId={car.id} />
          </div>

          {/* Рейтинг продавца */}
          <div className="car-detail-seller-rating" onClick={(e) => e.stopPropagation()}>
            {car.sellerId ? (
              !isMyCar ? (
                <SellerRating 
                  sellerId={car.sellerId} 
                  sellerName={seller?.name || car.seller?.name || t('cars.seller')} 
                />
              ) : (
                <div className="seller-rating-container" style={{ background: '#f0f4ff' }}>
                  <h3 className="rating-title">⭐ {t('cars.sellerRating')}</h3>
                  <p style={{ margin: 0, color: '#666', textAlign: 'center', padding: '12px' }}>
                    ℹ️ {t('cars.yourCarNoRate')}
                  </p>
                </div>
              )
            ) : (
              <div className="seller-rating-container">
                <h3 className="rating-title">⭐ {t('cars.sellerRating')}</h3>
                <p style={{ margin: 0, color: '#999', textAlign: 'center', padding: '12px' }}>
                  {t('cars.sellerInfoUnavailable')}
                </p>
              </div>
            )}
          </div>
        </div>

        {showChat && !isMyCar && (
          <div className="car-detail-chat">
            <Chat carId={car.id} sellerId={car.sellerId} onClose={() => setShowChat(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CarDetail;
