import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './Balance.css';

const Balance = ({ onNavigate }) => {
  const { user, fetchUser } = useContext(AuthContext);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Обновляем данные пользователя при загрузке компонента
    const updateBalance = async () => {
      setLoading(true);
      await fetchUser();
    };
    updateBalance();
  }, []);

  useEffect(() => {
    if (user) {
      const currentBalance = parseFloat(user.balance || 0);
      setBalance(currentBalance);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [user]);

  const formatBalance = (amount) => {
    return new Intl.NumberFormat('kk-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="balance-container">
      <div className="balance-header">
        <h1>💰 Баланс</h1>
      </div>

      {error && <div className="balance-alert balance-alert-error">{error}</div>}
      {success && <div className="balance-alert balance-alert-success">{success}</div>}

      {loading ? (
        <div className="balance-loading">Загрузка...</div>
      ) : (
        <div className="balance-content">
          <div className="balance-card">
            <div className="balance-icon">💰</div>
            <div className="balance-amount">
              {formatBalance(balance)}
            </div>
            <div className="balance-label">Ваш личный баланс</div>
            <div className="balance-info">
              <p>Используйте баланс для покупки автомобилей в корзине</p>
              <p className="balance-hint">💡 При покупке средства автоматически списываются с вашего баланса</p>
              <p className="balance-hint">👤 У каждого пользователя свой индивидуальный баланс</p>
            </div>
          </div>

          <div className="balance-stats">
            <div className="stat-item stat-item-clickable" onClick={() => onNavigate && onNavigate('cart')}>
              <div className="stat-icon">🛒</div>
              <div className="stat-content">
                <div className="stat-value">Корзина</div>
                <div className="stat-label">Перейти к покупкам</div>
              </div>
            </div>
            <div className="stat-item stat-item-clickable" onClick={() => onNavigate && onNavigate('profile')}>
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">История</div>
                <div className="stat-label">Просмотр покупок</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Balance;
