import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import LanguageContext from '../context/LanguageContext';
import { WS_URL } from '../config';
import './NotificationBell.css';

const NotificationBell = () => {
  const { t } = useContext(LanguageContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Подключаемся к Socket.io для real-time уведомлений
    const token = localStorage.getItem('token');
    const socket = io(WS_URL, {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('Notification socket connected');
    });

    socket.on('notification', (notificationData) => {
      // Добавляем новое уведомление
      const newNotification = {
        id: Date.now(), // Временный ID
        text: notificationData.text || notificationData,
        type: notificationData.type || 'general',
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      // Обновляем список для получения полной информации
      fetchNotifications();
      fetchUnreadCount();
    });

    // Обновляем каждые 30 секунд (fallback)
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Ошибка загрузки количества уведомлений:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`/api/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Ошибка обновления уведомления:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Ошибка обновления уведомлений:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.read ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error('Ошибка удаления уведомления:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <i className="bi bi-chat-heart-fill" aria-hidden />;
      case 'price_drop':
        return <i className="bi bi-coin" aria-hidden />;
      case 'test_drive_approved':
        return <i className="bi bi-car-front-fill" aria-hidden />;
      default:
        return <i className="bi bi-bell-fill" aria-hidden />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('common.justNow');
    if (minutes < 60) return `${minutes} ${t('common.minutesAgo')}`;
    if (hours < 24) return `${hours} ${t('common.hoursAgo')}`;
    if (days < 7) return `${days} ${t('common.daysAgo')}`;
    return date.toLocaleDateString('kk-KZ');
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell"
        onClick={() => setShowDropdown(!showDropdown)}
        title={t('notifications.title')}
      >
        <i className="bi bi-bell-fill" aria-hidden />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={markAllAsRead}>
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <p>{t('notifications.noNotifications')}</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <p className="notification-text">{notification.text}</p>
                    <span className="notification-time">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  <button
                    className="notification-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    title={t('notifications.deleteTitle')}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
