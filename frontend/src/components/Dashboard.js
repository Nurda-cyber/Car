import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import CarsList from './CarsList';
import AdminPanel from './AdminPanel';
import Profile from './Profile';
import Cart from './Cart';
import Balance from './Balance';
import SellCar from './SellCar';
import ChatList from './ChatList';
import NotificationBell from './NotificationBell';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout, fetchUser } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Позволяем приходить на дашборд с заранее выбранной вкладкой через location.state.activeTab
  const initialTab =
    location.state?.activeTab ||
    (user?.role === 'admin' ? 'admin' : 'cars');

  const [activeTab, setActiveTab] = useState(initialTab);

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
          <NotificationBell />
          <button
            className="btn-theme-toggle"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Переключить на темный режим' : 'Переключить на светлый режим'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
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
          className={`tab ${activeTab === 'sell' ? 'active' : ''}`}
          onClick={() => handleTabChange('sell')}
        >
          🚙 Продать
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
        <button
          className={`tab ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => handleTabChange('chats')}
        >
          💬 Чаты
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
        ) : activeTab === 'sell' ? (
          <SellCar />
        ) : activeTab === 'cart' ? (
          <Cart />
        ) : activeTab === 'balance' ? (
          <Balance onNavigate={handleTabChange} />
        ) : activeTab === 'chats' ? (
          <ChatList />
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
