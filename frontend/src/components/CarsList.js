import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import LanguageContext from '../context/LanguageContext';
import { API_BASE } from '../config';
import './CarsList.css';

const CarsList = () => {
  const { user } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [filters, setFilters] = useState({
    search: '',
    brand: '',
    model: '',
    minYear: '',
    maxYear: '',
    minPrice: '',
    maxPrice: '',
    transmission: '',
    fuelType: '',
    city: '',
    sortBy: ''
  });

  useEffect(() => {
    fetchCars();
    fetchFavorites();
    fetchCart();
  }, [filters]);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      const response = await axios.get(`/api/cars?${params.toString()}`);
      console.log('Загружены автомобили:', response.data);
      // Убеждаемся, что у каждого автомобиля есть поля для рейтинга
      const carsWithRatings = response.data.map(car => ({
        ...car,
        averageRating: car.averageRating !== undefined ? car.averageRating : 0,
        totalRatings: car.totalRatings !== undefined ? car.totalRatings : 0
      }));
      console.log('Автомобили с рейтингами:', carsWithRatings);
      setCars(carsWithRatings);
    } catch (error) {
      console.error('Ошибка загрузки автомобилей:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await axios.get('/api/cars/favorites/list');
      setFavorites(response.data.map(car => car.id));
    } catch (error) {
      console.error('Ошибка загрузки избранного:', error);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await axios.get('/api/cart');
      setCartItems(response.data.map(item => item.carId));
    } catch (error) {
      console.error('Ошибка загрузки корзины:', error);
    }
  };

  const toggleFavorite = async (carId) => {
    try {
      const isFavorite = favorites.includes(carId);
      if (isFavorite) {
        await axios.delete(`/api/cars/${carId}/favorite`);
        setFavorites(favorites.filter(id => id !== carId));
      } else {
        await axios.post(`/api/cars/${carId}/favorite`);
        setFavorites([...favorites, carId]);
      }
    } catch (error) {
      console.error('Ошибка обновления избранного:', error);
      setMessage({ text: error.response?.data?.message || t('cars.errorFavorites'), type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const addToCart = async (carId) => {
    try {
      await axios.post(`/api/cart/${carId}`);
      setCartItems([...cartItems, carId]);
      setMessage({ text: t('cars.addedToCart'), type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error('Ошибка добавления в корзину:', error);
      setMessage({ text: error.response?.data?.message || t('cars.errorAddToCart'), type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="cars-list-container">
      <h1>{t('cars.catalogTitle')}</h1>
      
      {message.text && (
        <div className={`cars-message cars-message-${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="filters-panel">
        <h2>{t('cars.filters')}</h2>
        <div className="filters-grid">
          <input
            type="text"
            name="search"
            placeholder={t('cars.searchPlaceholder')}
            value={filters.search}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="text"
            name="brand"
            placeholder={t('cars.brand')}
            value={filters.brand}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="text"
            name="model"
            placeholder={t('cars.model')}
            value={filters.model}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="number"
            name="minYear"
            placeholder={t('cars.yearFrom')}
            value={filters.minYear}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="number"
            name="maxYear"
            placeholder={t('cars.yearTo')}
            value={filters.maxYear}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="number"
            name="minPrice"
            placeholder={t('cars.priceFrom')}
            value={filters.minPrice}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="number"
            name="maxPrice"
            placeholder={t('cars.priceTo')}
            value={filters.maxPrice}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <select
            name="transmission"
            value={filters.transmission}
            onChange={handleFilterChange}
            className="filter-input"
          >
            <option value="">{t('cars.allTransmissions')}</option>
            <option value="manual">{t('cars.manual')}</option>
            <option value="automatic">{t('cars.automatic')}</option>
            <option value="cvt">{t('cars.cvt')}</option>
          </select>
          <select
            name="fuelType"
            value={filters.fuelType}
            onChange={handleFilterChange}
            className="filter-input"
          >
            <option value="">{t('cars.allFuel')}</option>
            <option value="petrol">{t('cars.petrol')}</option>
            <option value="diesel">{t('cars.diesel')}</option>
            <option value="electric">{t('cars.electric')}</option>
            <option value="hybrid">{t('cars.hybrid')}</option>
          </select>
          <select
            name="city"
            value={filters.city}
            onChange={handleFilterChange}
            className="filter-input"
          >
            <option value="">{t('cars.allCities')}</option>
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
          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleFilterChange}
            className="filter-input"
          >
            <option value="">{t('cars.sortBy')}</option>
            <option value="city">{t('cars.sortCity')}</option>
            <option value="price_asc">{t('cars.sortPriceAsc')}</option>
            <option value="price_desc">{t('cars.sortPriceDesc')}</option>
            <option value="year_desc">{t('cars.sortYearNew')}</option>
            <option value="year_asc">{t('cars.sortYearOld')}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">{t('common.loading')}</div>
      ) : cars.length === 0 ? (
        <div className="no-cars">{t('cars.noCars')}</div>
      ) : (
        <div className="cars-grid">
          {cars.map(car => (
            <div key={car.id} className="car-card" onClick={() => navigate(`/car/${car.id}`)}>
              <div className="car-image">
                {car.photos && car.photos.length > 0 ? (
                  <img src={`${API_BASE}${car.photos[0]}`} alt={`${car.brand} ${car.model}`} />
                ) : (
                  <div className="no-image">{t('common.noPhoto')}</div>
                )}
                <button
                  className={`favorite-btn ${favorites.includes(car.id) ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(car.id);
                  }}
                  title={favorites.includes(car.id) ? t('cars.removeFromFavorites') : t('cars.addToFavorites')}
                >
                  ❤️
                </button>
              </div>
              <div className="car-info">
                <h3>{car.brand} {car.model}</h3>
                <p className="car-year">{car.year} {t('common.year')}</p>
                <p className="car-price">{parseInt(car.price).toLocaleString('kk-KZ')} ₸</p>
                
                {/* Оценка автомобиля (5 звезд) - всегда отображается */}
                <div className="car-rating">
                  <div className="car-rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => {
                      // Получаем рейтинг из данных или используем 0
                      const avgRating = (car.averageRating !== undefined && car.averageRating !== null) 
                        ? parseFloat(car.averageRating) 
                        : 0;
                      // Звезда заполнена, если её номер <= округленного рейтинга
                      const isFilled = star <= Math.round(avgRating);
                      return (
                        <span
                          key={star}
                          className={`star ${isFilled ? 'filled' : ''}`}
                          title={`${avgRating > 0 ? avgRating.toFixed(1) : t('cars.noRatings')}`}
                        >
                          ⭐
                        </span>
                      );
                    })}
                  </div>
                  {(car.averageRating !== undefined && car.averageRating !== null && car.averageRating > 0) ? (
                    <>
                      <span className="car-rating-value">
                        {parseFloat(car.averageRating).toFixed(1)}
                      </span>
                      {car.totalRatings > 0 && (
                        <span className="car-rating-count">
                          ({car.totalRatings})
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="car-rating-no-rating">
                      {t('cars.noRatings')}
                    </span>
                  )}
                </div>
                
                {car.views !== undefined && car.views !== null && (
                  <p className="car-views">👁️ {t('cars.views')}: {car.views.toLocaleString('kk-KZ')}</p>
                )}
                {car.city && (
                  <p className="car-city">📍 {t('cars.city')}: {car.city}</p>
                )}
                {car.distance !== null && car.distance !== undefined && (
                  <p className="car-distance">📍 {t('cars.distance')}: {car.distance} км</p>
                )}
                {car.mileage && <p className="car-mileage">{t('cars.mileage')}: {car.mileage.toLocaleString()} км</p>}
                {car.transmission && (
                  <p className="car-detail">
                    {t('cars.transmission')}: {car.transmission === 'manual' ? t('cars.manual') : 
                          car.transmission === 'automatic' ? t('cars.automatic') : t('cars.cvt')}
                  </p>
                )}
                {car.fuelType && (
                  <p className="car-detail">
                    {t('cars.fuel')}: {car.fuelType === 'petrol' ? t('cars.petrol') :
                              car.fuelType === 'diesel' ? t('cars.diesel') :
                              car.fuelType === 'electric' ? t('cars.electric') : t('cars.hybrid')}
                  </p>
                )}
                <button
                  className={`btn-add-to-cart ${cartItems.includes(car.id) ? 'in-cart' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(car.id);
                  }}
                  disabled={cartItems.includes(car.id) || car.status === 'sold'}
                  title={cartItems.includes(car.id) ? t('cars.inCartTitle') : car.status === 'sold' ? t('cars.soldTitle') : t('cars.addToCart')}
                >
                  {cartItems.includes(car.id) ? t('cars.inCart') : `🛒 ${t('cars.addToCart')}`}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CarsList;
