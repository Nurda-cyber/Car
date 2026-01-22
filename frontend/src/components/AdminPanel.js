import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';

const AdminPanel = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    price: '',
    mileage: '',
    color: '',
    engine: '',
    transmission: '',
    fuelType: '',
    description: '',
    status: 'pending',
    photos: []
  });

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/cars');
      setCars(response.data);
    } catch (error) {
      console.error('Ошибка загрузки автомобилей:', error);
      alert('Ошибка загрузки автомобилей');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      photos: Array.from(e.target.files)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'photos') {
          formDataToSend.append(key, formData[key]);
        }
      });
      formData.photos.forEach(photo => {
        formDataToSend.append('photos', photo);
      });

      if (editingCar) {
        await axios.put(`/admin/cars/${editingCar.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Автомобиль обновлен');
      } else {
        await axios.post('/admin/cars', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Автомобиль добавлен');
      }

      setShowAddForm(false);
      setEditingCar(null);
      resetForm();
      fetchCars();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert(error.response?.data?.message || 'Ошибка сохранения');
    }
  };

  const handleEdit = (car) => {
    setEditingCar(car);
    setFormData({
      brand: car.brand,
      model: car.model,
      year: car.year.toString(),
      price: car.price.toString(),
      mileage: car.mileage ? car.mileage.toString() : '',
      color: car.color || '',
      engine: car.engine || '',
      transmission: car.transmission || '',
      fuelType: car.fuelType || '',
      description: car.description || '',
      status: car.status,
      photos: []
    });
    setShowAddForm(true);
  };

  const handleToggleActive = async (carId) => {
    try {
      await axios.patch(`/admin/cars/${carId}/toggle`);
      fetchCars();
    } catch (error) {
      console.error('Ошибка переключения статуса:', error);
      alert('Ошибка переключения статуса');
    }
  };

  const handleDeletePhoto = async (carId, photoIndex) => {
    try {
      await axios.delete(`/admin/cars/${carId}/photos/${photoIndex}`);
      fetchCars();
    } catch (error) {
      console.error('Ошибка удаления фото:', error);
      alert('Ошибка удаления фото');
    }
  };

  const resetForm = () => {
    setFormData({
      brand: '',
      model: '',
      year: '',
      price: '',
      mileage: '',
      color: '',
      engine: '',
      transmission: '',
      fuelType: '',
      description: '',
      status: 'pending',
      photos: []
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'На обработке',
      active: 'Активен',
      sold: 'Продан',
      disabled: 'Отключен'
    };
    return labels[status] || status;
  };

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <h1>Панель администратора</h1>
        <button
          className="btn-add"
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (showAddForm) {
              setEditingCar(null);
              resetForm();
            }
          }}
        >
          {showAddForm ? 'Отмена' : '+ Добавить автомобиль'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-car-form">
          <h2>{editingCar ? 'Редактировать автомобиль' : 'Добавить автомобиль'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div>
                <label>Марка *</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label>Модель *</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label>Год *</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label>Цена *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label>Пробег (км)</label>
                <input
                  type="number"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>Цвет</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>Двигатель</label>
                <input
                  type="text"
                  name="engine"
                  value={formData.engine}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label>Коробка передач</label>
                <select
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
              <div>
                <label>Тип топлива</label>
                <select
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
              <div>
                <label>Статус</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="pending">На обработке</option>
                  <option value="active">Активен</option>
                  <option value="sold">Продан</option>
                  <option value="disabled">Отключен</option>
                </select>
              </div>
            </div>
            <div>
              <label>Описание</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
              />
            </div>
            <div>
              <label>Фото {editingCar ? '(добавить новые)' : ''}</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            {editingCar && editingCar.photos && editingCar.photos.length > 0 && (
              <div className="existing-photos">
                <label>Текущие фото:</label>
                <div className="photos-grid">
                  {editingCar.photos.map((photo, index) => (
                    <div key={index} className="photo-item">
                      <img src={`http://localhost:5000${photo}`} alt={`Фото ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(editingCar.id, index)}
                        className="btn-delete-photo"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button type="submit" className="btn-submit">
              {editingCar ? 'Обновить' : 'Добавить'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : (
        <div className="admin-cars-list">
          <h2>Все автомобили ({cars.length})</h2>
          <table className="cars-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Марка/Модель</th>
                <th>Год</th>
                <th>Цена</th>
                <th>Статус</th>
                <th>Активен</th>
                <th>Фото</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {cars.map(car => (
                <tr key={car.id}>
                  <td>{car.id}</td>
                  <td>{car.brand} {car.model}</td>
                  <td>{car.year}</td>
                  <td>{parseInt(car.price).toLocaleString()} ₽</td>
                  <td>
                    <span className={`status-badge status-${car.status}`}>
                      {getStatusLabel(car.status)}
                    </span>
                  </td>
                  <td>{car.isActive ? 'Да' : 'Нет'}</td>
                  <td>{car.photos ? car.photos.length : 0}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(car)}
                        className="btn-edit"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleToggleActive(car.id)}
                        className={`btn-toggle ${car.isActive ? 'active' : ''}`}
                      >
                        {car.isActive ? 'Отключить' : 'Включить'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
