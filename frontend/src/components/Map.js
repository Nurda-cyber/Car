import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import axios from 'axios';
import './Map.css';

const Map = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/cars');
      // Фильтруем только автомобили с координатами
      const carsWithLocation = response.data.filter(car => 
        car.latitude && car.longitude
      );
      setCars(carsWithLocation);
    } catch (error) {
      console.error('Ошибка загрузки автомобилей:', error);
    } finally {
      setLoading(false);
    }
  };

  // Используем OpenStreetMap через Leaflet или простую карту через iframe
  // Для простоты используем статическую карту с маркерами через Leaflet
  // Но сначала проверим, установлена ли библиотека

  if (loading) {
    return <div className="map-loading">Загрузка карты...</div>;
  }

  if (cars.length === 0) {
    return (
      <div className="map-empty">
        <div className="empty-icon">🗺️</div>
        <h2>Нет автомобилей с указанным местоположением</h2>
        <p>Добавьте координаты для автомобилей, чтобы увидеть их на карте</p>
      </div>
    );
  }

  // Используем Leaflet для карты
  // Если библиотека не установлена, используем простую карту через iframe
  return (
    <div className="map-container">
      <div className="map-header">
        <h1>🗺️ Карта автомобилей</h1>
        <p className="map-subtitle">Найдите автомобили на карте</p>
      </div>
      
      <div className="map-wrapper">
        <div className="map-content">
          {/* Простая карта через Leaflet или OpenStreetMap */}
          <div id="map" className="leaflet-map">
            {cars.map(car => (
              <div
                key={car.id}
                className="map-marker"
                style={{
                  left: `${((parseFloat(car.longitude) + 180) / 360) * 100}%`,
                  top: `${((90 - parseFloat(car.latitude)) / 180) * 100}%`
                }}
                onClick={() => setSelectedCar(car)}
                title={`${car.brand} ${car.model}`}
              >
                🚗
              </div>
            ))}
          </div>
        </div>

        <div className="map-sidebar">
          <h3>Автомобили на карте</h3>
          <div className="cars-list">
            {cars.map(car => (
              <div
                key={car.id}
                className={`car-list-item ${selectedCar?.id === car.id ? 'selected' : ''}`}
                onClick={() => setSelectedCar(car)}
              >
                <div className="car-list-image">
                  {car.photos && car.photos.length > 0 ? (
                    <img 
                      src={`${API_BASE}${car.photos[0]}`} 
                      alt={`${car.brand} ${car.model}`} 
                    />
                  ) : (
                    <div className="no-image-small">🚗</div>
                  )}
                </div>
                <div className="car-list-info">
                  <h4>{car.brand} {car.model}</h4>
                  <p className="car-list-price">{parseInt(car.price).toLocaleString('kk-KZ')} ₸</p>
                  {car.location && <p className="car-list-location">📍 {car.location}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedCar && (
        <div className="map-popup">
          <div className="popup-content">
            <button className="popup-close" onClick={() => setSelectedCar(null)}>×</button>
            <div className="popup-image">
              {selectedCar.photos && selectedCar.photos.length > 0 ? (
                <img 
                  src={`${API_BASE}${selectedCar.photos[0]}`} 
                  alt={`${selectedCar.brand} ${selectedCar.model}`} 
                />
              ) : (
                <div className="no-image-popup">Нет фото</div>
              )}
            </div>
            <div className="popup-info">
              <h3>{selectedCar.brand} {selectedCar.model}</h3>
              <p className="popup-year">{selectedCar.year} год</p>
              <p className="popup-price">{parseInt(selectedCar.price).toLocaleString('kk-KZ')} ₸</p>
              {selectedCar.location && <p className="popup-location">📍 {selectedCar.location}</p>}
              {selectedCar.mileage && (
                <p className="popup-detail">Пробег: {selectedCar.mileage.toLocaleString('kk-KZ')} км</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
