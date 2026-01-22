import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import CarsList from './CarsList';
import AdminPanel from './AdminPanel';
import Profile from './Profile';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'admin' : 'cars');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="user-info-header">
          <h1>CarPro</h1>
          <div className="user-details">
            <span><strong>{user?.name}</strong></span>
            <span className="user-role">{user?.role === 'admin' ? '👑 Администратор' : '👤 Пользователь'}</span>
          </div>
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
          onClick={() => setActiveTab('cars')}
        >
          Каталог
        </button>
        {user?.role === 'admin' && (
          <button
            className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            Админ-панель
          </button>
        )}
      </div>

      <div className="dashboard-content">
        {activeTab === 'profile' ? (
          <Profile />
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
