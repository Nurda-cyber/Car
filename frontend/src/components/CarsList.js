import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './CarsList.css';

const CarsList = () => {
  const { user } = useContext(AuthContext);
  const [cars, setCars] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    brand: '',
    model: '',
    minYear: '',
    maxYear: '',
    minPrice: '',
    maxPrice: '',
    transmission: '',
    fuelType: ''
  });

  useEffect(() => {
    fetchCars();
    fetchFavorites();
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
      const response = await axios.get(`/cars?${params.toString()}`);
      setCars(response.data);
    } catch (error) {
      console.error('Ошибка загрузки автомобилей:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await axios.get('/cars/favorites/list');
      setFavorites(response.data.map(car => car.id));
    } catch (error) {
      console.error('Ошибка загрузки избранного:', error);
    }
  };

  const toggleFavorite = async (carId) => {
    try {
      const isFavorite = favorites.includes(carId);
      if (isFavorite) {
        await axios.delete(`/cars/${carId}/favorite`);
        setFavorites(favorites.filter(id => id !== carId));
      } else {
        await axios.post(`/cars/${carId}/favorite`);
        setFavorites([...favorites, carId]);
      }
    } catch (error) {
      console.error('Ошибка обновления избранного:', error);
      alert(error.response?.data?.message || 'Ошибка обновления избранного');
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
      <h1>Каталог автомобилей</h1>
      
      <div className="filters-panel">
        <h2>Фильтры</h2>
        <div className="filters-grid">
          <input
            type="text"
            name="search"
            placeholder="Поиск по марке/модели"
            value={filters.search}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="text"
            name="brand"
            placeholder="Марка"
            value={filters.brand}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="text"
            name="model"
            placeholder="Модель"
            value={filters.model}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="number"
            name="minYear"
            placeholder="Год от"
            value={filters.minYear}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="number"
            name="maxYear"
            placeholder="Год до"
            value={filters.maxYear}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="number"
            name="minPrice"
            placeholder="Цена от"
            value={filters.minPrice}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="number"
            name="maxPrice"
            placeholder="Цена до"
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
            <option value="">Все коробки</option>
            <option value="manual">Механическая</option>
            <option value="automatic">Автоматическая</option>
            <option value="cvt">Вариатор</option>
          </select>
          <select
            name="fuelType"
            value={filters.fuelType}
            onChange={handleFilterChange}
            className="filter-input"
          >
            <option value="">Все типы топлива</option>
            <option value="petrol">Бензин</option>
            <option value="diesel">Дизель</option>
            <option value="electric">Электрический</option>
            <option value="hybrid">Гибрид</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : cars.length === 0 ? (
        <div className="no-cars">Автомобили не найдены</div>
      ) : (
        <div className="cars-grid">
          {cars.map(car => (
            <div key={car.id} className="car-card">
              <div className="car-image">
                {car.photos && car.photos.length > 0 ? (
                  <img src={`http://localhost:5000${car.photos[0]}`} alt={`${car.brand} ${car.model}`} />
                ) : (
                  <div className="no-image">Нет фото</div>
                )}
                <button
                  className={`favorite-btn ${favorites.includes(car.id) ? 'active' : ''}`}
                  onClick={() => toggleFavorite(car.id)}
                  title={favorites.includes(car.id) ? 'Удалить из избранного' : 'Добавить в избранное'}
                >
                  ❤️
                </button>
              </div>
              <div className="car-info">
                <h3>{car.brand} {car.model}</h3>
                <p className="car-year">{car.year} год</p>
                <p className="car-price">{parseInt(car.price).toLocaleString()} ₽</p>
                {car.mileage && <p className="car-mileage">Пробег: {car.mileage.toLocaleString()} км</p>}
                {car.transmission && (
                  <p className="car-detail">
                    КПП: {car.transmission === 'manual' ? 'Механическая' : 
                          car.transmission === 'automatic' ? 'Автоматическая' : 'Вариатор'}
                  </p>
                )}
                {car.fuelType && (
                  <p className="car-detail">
                    Топливо: {car.fuelType === 'petrol' ? 'Бензин' :
                              car.fuelType === 'diesel' ? 'Дизель' :
                              car.fuelType === 'electric' ? 'Электрический' : 'Гибрид'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CarsList;
