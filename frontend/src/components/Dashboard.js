import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import LanguageContext from '../context/LanguageContext';
import ThemeContext from '../context/ThemeContext';
import CarsList from './CarsList';
import AdminPanel from './AdminPanel';
import Profile from './Profile';
import Cart from './Cart';
import Balance from './Balance';
import SellCar from './SellCar';
import ChatList from './ChatList';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from './LanguageSwitcher';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout, fetchUser } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
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
            type="button"
            className="btn-theme-toggle"
            onClick={toggleTheme}
            title={theme === 'light' ? t('nav.themeDark') : t('nav.themeLight')}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <LanguageSwitcher />
          <div className="header-actions-right">
            <button
              className={`btn-profile ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              👤 {t('nav.profile')}
            </button>
            <button onClick={handleLogout} className="btn-logout">
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'cars' ? 'active' : ''}`}
          onClick={() => handleTabChange('cars')}
        >
          🚗 {t('nav.catalog')}
        </button>
        <button
          className={`tab ${activeTab === 'sell' ? 'active' : ''}`}
          onClick={() => handleTabChange('sell')}
        >
          🚙 {t('nav.sell')}
        </button>
        <button
          className={`tab ${activeTab === 'cart' ? 'active' : ''}`}
          onClick={() => handleTabChange('cart')}
        >
          🛒 {t('nav.cart')}
        </button>
        <button
          className={`tab ${activeTab === 'balance' ? 'active' : ''}`}
          onClick={() => handleTabChange('balance')}
        >
          💰 {t('nav.balance')}
        </button>
        <button
          className={`tab ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => handleTabChange('chats')}
        >
          💬 {t('nav.chats')}
        </button>
        {user?.role === 'admin' && (
          <button
            className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => handleTabChange('admin')}
          >
            ⚙️ {t('nav.adminPanel')}
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
