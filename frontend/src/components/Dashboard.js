import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import CarsList from './CarsList';
import AdminPanel from './AdminPanel';
import Profile from './Profile';
import Cart from './Cart';
import Balance from './Balance';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout, fetchUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'admin' : 'cars');

  // Обновляем данные пользователя при переключении на вкладки баланса или корзины
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'balance' || tab === 'cart') {
      fetchUser(); // Обновляем баланс для актуальной кнопки «Купить»
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="user-info-header">
          <h1>CarPro</h1>
        </div>
        <div className="header-actions">
          <button
            className={`btn-profile ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Профиль
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Выйти
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'cars' ? 'active' : ''}`}
          onClick={() => handleTabChange('cars')}
        >
          🚗 Каталог
        </button>
        <button
          className={`tab ${activeTab === 'cart' ? 'active' : ''}`}
          onClick={() => handleTabChange('cart')}
        >
          🛒 Корзина
        </button>
        <button
          className={`tab ${activeTab === 'balance' ? 'active' : ''}`}
          onClick={() => handleTabChange('balance')}
        >
          💰 Баланс
        </button>
        {user?.role === 'admin' && (
          <button
            className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => handleTabChange('admin')}
          >
            ⚙️ Админ-панель
          </button>
        )}
      </div>

      <div className="dashboard-content">
        {activeTab === 'profile' ? (
          <Profile />
        ) : activeTab === 'cart' ? (
          <Cart />
        ) : activeTab === 'balance' ? (
          <Balance onNavigate={handleTabChange} />
        ) : activeTab === 'admin' && user?.role === 'admin' ? (
          <AdminPanel />
        ) : (
          <CarsList />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
