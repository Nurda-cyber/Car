import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './Cart.css';

const Cart = () => {
  const { user, fetchUser } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/cart');
      // Проверяем, что данные корректны
      if (Array.isArray(response.data)) {
        setCartItems(response.data);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки корзины:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Ошибка загрузки корзины';
      setError(errorMessage);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (carId) => {
    try {
      await axios.delete(`/api/cart/${carId}`);
      setCartItems(cartItems.filter(item => item.carId !== carId));
      setSuccess('Автомобиль удален из корзины');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка удаления из корзины');
      setTimeout(() => setError(''), 3000);
    }
  };

  const checkout = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      console.log('[FRONTEND] Начало покупки...');
      const response = await axios.post('/api/cart/checkout');
      console.log('[FRONTEND] Ответ сервера:', response.data);
      
      // Формируем сообщение с учетом предупреждений
      let message = response.data.message;
      if (response.data.warning) {
        message += `. ${response.data.warning}`;
      }
      
      setSuccess(message);
      setCartItems([]);
      
      // Обновляем данные пользователя и корзины
      await Promise.all([
        fetchUser(), // Обновляем баланс пользователя
        fetchCart() // Обновляем корзину
      ]);
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('[FRONTEND] Ошибка покупки:', error);
      console.error('[FRONTEND] Детали ошибки:', error.response?.data);
      const message = error.response?.data?.message || 'Ошибка покупки';
      setError(message);
      await fetchCart(); // Обновляем корзину после ошибки
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + parseFloat(item.car?.price || 0);
    }, 0);
  };

  const totalPrice = calculateTotal();
  const userBalance = parseFloat(user?.balance || 0);
  const canAfford = userBalance >= totalPrice;

  if (loading) {
    return <div className="cart-loading">Загрузка корзины...</div>;
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>🛒 Корзина</h1>
      </div>

      {error && <div className="cart-alert cart-alert-error">{error}</div>}
      {success && <div className="cart-alert cart-alert-success">{success}</div>}

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <div className="empty-icon">🛒</div>
          <h2>Корзина пуста</h2>
          <p>Добавьте автомобили в корзину для покупки</p>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-image">
                  {item.car?.photos && item.car.photos.length > 0 ? (
                    <img 
                      src={`http://localhost:5000${item.car.photos[0]}`} 
                      alt={`${item.car.brand} ${item.car.model}`} 
                    />
                  ) : (
                    <div className="no-image">Нет фото</div>
                  )}
                </div>
                <div className="cart-item-info">
                  <h3>{item.car?.brand} {item.car?.model}</h3>
                  <p className="cart-item-year">{item.car?.year} год</p>
                  {item.car?.mileage && (
                    <p className="cart-item-mileage">Пробег: {item.car.mileage.toLocaleString()} км</p>
                  )}
                  {item.car?.transmission && (
                    <p className="cart-item-detail">
                      КПП: {item.car.transmission === 'manual' ? 'Механическая' : 
                            item.car.transmission === 'automatic' ? 'Автоматическая' : 'Вариатор'}
                    </p>
                  )}
                </div>
                <div className="cart-item-price">
                  <div className="price-value">{parseInt(item.car?.price || 0).toLocaleString('kk-KZ')} ₸</div>
                  <button 
                    className="btn-remove-from-cart"
                    onClick={() => removeFromCart(item.carId)}
                    title="Удалить из корзины"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span className="summary-label">Итого:</span>
              <span className="summary-total">{totalPrice.toLocaleString('kk-KZ')} ₸</span>
            </div>
            {!canAfford && (
              <div className="insufficient-funds">
                ⚠️ Недостаточно средств. Не хватает: {(totalPrice - userBalance).toLocaleString('kk-KZ')} ₸
              </div>
            )}
            <button 
              className={`btn-checkout ${canAfford ? '' : 'disabled'}`}
              onClick={checkout}
              disabled={!canAfford}
            >
              {canAfford ? '💳 Купить' : 'Недостаточно средств'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
