import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import './Chat.css';

const Chat = ({ carId, sellerId, onClose }) => {
  const { user } = React.useContext(AuthContext);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    initializeChat();
    initializeSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [carId, sellerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/chat', { carId });
      setChat(response.data);

      // Загружаем сообщения
      const messagesResponse = await axios.get(`/api/chat/${response.data.id}`);
      setMessages(messagesResponse.data.messages);
    } catch (error) {
      console.error('Ошибка инициализации чата:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      if (chat) {
        newSocket.emit('join-chat', chat.id);
      }
    });

    newSocket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    newSocket.on('typing', ({ userId, isTyping: typing }) => {
      if (userId !== user.id) {
        setIsTyping(typing);
        if (typing) {
          setTypingUser(userId);
        } else {
          setTypingUser(null);
        }
      }
    });

    newSocket.on('notification', (notification) => {
      // Можно показать toast уведомление
      console.log('New notification:', notification);
    });

    setSocket(newSocket);
  };

  useEffect(() => {
    if (socket && chat) {
      socket.emit('join-chat', chat.id);
    }
  }, [socket, chat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !chat) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const response = await axios.post(`/api/chat/${chat.id}/messages`, {
        text: messageText
      });

      // Сообщение будет добавлено через Socket.io событие
      // Но добавляем локально для мгновенного отображения
      setMessages(prev => [...prev, response.data]);
      scrollToBottom();

      // Останавливаем индикатор печати
      if (socket) {
        socket.emit('typing', { chatId: chat.id, isTyping: false });
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      setNewMessage(messageText); // Восстанавливаем текст при ошибке
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!socket || !chat) return;

    // Отправляем событие печати
    socket.emit('typing', { chatId: chat.id, isTyping: true });

    // Очищаем предыдущий таймаут
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Останавливаем индикатор печати через 3 секунды
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { chatId: chat.id, isTyping: false });
    }, 3000);
  };

  const getOtherUser = () => {
    if (!chat) return null;
    return chat.buyerId === user.id ? chat.seller : chat.buyer;
  };

  if (loading) {
    return (
      <div className="chat-container">
        <div className="chat-loading">Загрузка чата...</div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="chat-container">
        <div className="chat-error">Ошибка загрузки чата</div>
      </div>
    );
  }

  const otherUser = getOtherUser();

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>Чат с {otherUser?.name || 'Продавцом'}</h3>
          {chat.car && (
            <p className="chat-car-info">
              {chat.car.brand} {chat.car.model} - {parseInt(chat.car.price).toLocaleString('kk-KZ')} ₸
            </p>
          )}
        </div>
        {onClose && (
          <button className="chat-close" onClick={onClose}>×</button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>Начните общение!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMyMessage = message.senderId === user.id;
            return (
              <div
                key={message.id}
                className={`chat-message ${isMyMessage ? 'my-message' : 'other-message'}`}
              >
                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="message-time">
                    {new Date(message.createdAt).toLocaleTimeString('kk-KZ', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        
        {isTyping && typingUser && (
          <div className="chat-message other-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          value={newMessage}
          onChange={handleTyping}
          placeholder="Введите сообщение..."
          maxLength={1000}
        />
        <button 
          type="submit" 
          className="chat-send-button"
          disabled={!newMessage.trim()}
        >
          Отправить
        </button>
      </form>
    </div>
  );
};

export default Chat;
