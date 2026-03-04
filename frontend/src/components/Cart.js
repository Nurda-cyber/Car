import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import LanguageContext from '../context/LanguageContext';
import { API_BASE } from '../config';
import './Cart.css';

const Cart = () => {
  const { user, fetchUser } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
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
      const errorMessage = error.response?.data?.message || error.response?.data?.error || t('cart.errorLoad');
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
      setSuccess(t('cart.removedFromCart'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || t('cart.errorRemove'));
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
      const message = error.response?.data?.message || t('cart.errorCheckout');
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
    return <div className="cart-loading">{t('cart.loading')}</div>;
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1><i className="bi bi-cart-check-fill" aria-hidden /> {t('cart.title')}</h1>
      </div>

      {error && <div className="cart-alert cart-alert-error">{error}</div>}
      {success && <div className="cart-alert cart-alert-success">{success}</div>}

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <div className="empty-icon"><i className="bi bi-cart-check-fill" aria-hidden /></div>
          <h2>{t('cart.empty')}</h2>
          <p>{t('cart.emptyHint')}</p>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-image">
                  {item.car?.photos && item.car.photos.length > 0 ? (
                    <img 
                      src={`${API_BASE}${item.car.photos[0]}`} 
                      alt={`${item.car.brand} ${item.car.model}`} 
                    />
                  ) : (
                    <div className="no-image">{t('common.noPhoto')}</div>
                  )}
                </div>
                <div className="cart-item-info">
                  <h3>{item.car?.brand} {item.car?.model}</h3>
                  <p className="cart-item-year">{item.car?.year} {t('common.year')}</p>
                  {item.car?.mileage && (
                    <p className="cart-item-mileage">{t('cars.mileage')}: {item.car.mileage.toLocaleString()} км</p>
                  )}
                  {item.car?.transmission && (
                    <p className="cart-item-detail">
                      {t('cars.transmission')}: {item.car.transmission === 'manual' ? t('cars.manual') : 
                            item.car.transmission === 'automatic' ? t('cars.automatic') : t('cars.cvt')}
                    </p>
                  )}
                </div>
                <div className="cart-item-price">
                  <div className="price-value">{parseInt(item.car?.price || 0).toLocaleString('kk-KZ')} ₸</div>
                  <button 
                    className="btn-remove-from-cart"
                    onClick={() => removeFromCart(item.carId)}
                    title={t('cart.removeFromCart')}
                  >
                    <i className="bi bi-trash-fill" aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span className="summary-label">{t('cart.total')}</span>
              <span className="summary-total">{totalPrice.toLocaleString('kk-KZ')} ₸</span>
            </div>
            {!canAfford && (
              <div className="insufficient-funds">
                <i className="bi bi-exclamation-triangle-fill" aria-hidden /> {t('cart.insufficientFunds')}. {t('cart.insufficientHint')} {(totalPrice - userBalance).toLocaleString('kk-KZ')} ₸
              </div>
            )}
            <button 
              className={`btn-checkout ${canAfford ? '' : 'disabled'}`}
              onClick={checkout}
              disabled={!canAfford}
            >
              {canAfford ? `💳 ${t('cart.buy')}` : t('cart.insufficientFunds')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
