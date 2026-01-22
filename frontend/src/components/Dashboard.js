import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h1>Добро пожаловать!</h1>
        <div className="user-info">
          <p><strong>Имя:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          Выйти
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
