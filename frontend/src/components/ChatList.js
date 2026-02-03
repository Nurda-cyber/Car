import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import { API_BASE, WS_URL } from '../config';
import Chat from './Chat';
import './ChatList.css';

const ChatList = () => {
  const navigate = useNavigate();
  const { user } = React.useContext(AuthContext);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchChats();
    
    // Инициализируем Socket.io для real-time обновлений
    const token = localStorage.getItem('token');
    if (token) {
      const socket = io(WS_URL, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('ChatList socket connected');
      });

      socket.on('new-message', (message) => {
        // Обновляем список чатов при новом сообщении
        setChats(prevChats => {
          return prevChats.map(chat => {
            // Если сообщение относится к этому чату
            if (message.chatId === chat.id) {
              // Обновляем счетчик непрочитанных, если сообщение не от текущего пользователя
              if (message.senderId !== user?.id) {
                return {
                  ...chat,
                  unreadCount: (chat.unreadCount || 0) + 1,
                  lastMessageAt: message.createdAt
                };
              }
            }
            return chat;
          });
        });
        // Также обновляем полный список для синхронизации
        fetchChats();
      });

      socketRef.current = socket;
    }
    
    // Обновляем список чатов каждые 10 секунд
    const interval = setInterval(fetchChats, 10000);
    
    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchChats = async () => {
    try {
      const response = await axios.get('/api/chat');
      setChats(response.data);
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = async (chatId) => {
    try {
      const response = await axios.get(`/api/chat/${chatId}`);
      setSelectedChat(response.data);
    } catch (error) {
      console.error('Ошибка загрузки чата:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} дн назад`;
    return date.toLocaleDateString('kk-KZ');
  };

  if (loading) {
    return <div className="chat-list-loading">Загрузка чатов...</div>;
  }

  return (
    <div className="chat-list-container">
      <div className="chat-list-sidebar">
        <div className="chat-list-header">
          <h2>💬 Мои чаты</h2>
        </div>

        {chats.length === 0 ? (
          <div className="chat-list-empty">
            <p>У вас пока нет чатов</p>
            <button onClick={() => navigate('/dashboard')}>
              Перейти к каталогу
            </button>
          </div>
        ) : (
          <div className="chat-list-items">
            {chats.map((chat) => {
              const lastMessage = chat.messages?.[0];
              // Определяем другого пользователя правильно
              const otherUser = chat.buyerId === user?.id ? chat.seller : chat.buyer;
              
              return (
                <div
                  key={chat.id}
                  className={`chat-list-item ${selectedChat?.chat?.id === chat.id ? 'active' : ''} ${chat.unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => handleChatClick(chat.id)}
                >
                  <div className="chat-item-image">
                    {chat.car?.photos && chat.car.photos.length > 0 ? (
                      <img
                        src={`${API_BASE}${chat.car.photos[0]}`}
                        alt={`${chat.car.brand} ${chat.car.model}`}
                      />
                    ) : (
                      <div className="no-image">🚗</div>
                    )}
                  </div>
                  <div className="chat-item-info">
                    <div className="chat-item-header">
                      <h4>{otherUser?.name || 'Пользователь'}</h4>
                      {chat.unreadCount > 0 && (
                        <span className="chat-unread-badge">{chat.unreadCount}</span>
                      )}
                    </div>
                    <p className="chat-item-car">
                      {chat.car?.brand} {chat.car?.model}
                    </p>
                    {lastMessage && (
                      <p className="chat-item-preview">
                        {lastMessage.text.length > 50
                          ? lastMessage.text.substring(0, 50) + '...'
                          : lastMessage.text}
                      </p>
                    )}
                    {chat.lastMessageAt && (
                      <span className="chat-item-time">
                        {formatDate(chat.lastMessageAt)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedChat && (
        <div className="chat-list-chat">
          <Chat
            chatId={selectedChat.chat.id}
            carId={selectedChat.chat.carId}
            sellerId={selectedChat.chat.sellerId}
            initialChat={selectedChat.chat}
            initialMessages={selectedChat.messages}
            onClose={() => {
              setSelectedChat(null);
              fetchChats(); // Обновляем список после закрытия чата
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ChatList;
