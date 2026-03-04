import React, { useState } from 'react';
import './ShareButton.css';

const ShareButton = ({ car }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/car/${car?.id || ''}`;
  const shareText = car 
    ? `Посмотрите на этот автомобиль: ${car.brand} ${car.model} ${car.year} года за ${parseInt(car.price).toLocaleString('kk-KZ')} ₸`
    : 'Посмотрите на этот автомобиль!';

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.open(url, '_blank');
    setShowMenu(false);
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
    setShowMenu(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setShowMenu(false);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Ошибка копирования:', error);
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setShowMenu(false);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="share-button-container">
      <button 
        className="share-button"
        onClick={() => setShowMenu(!showMenu)}
        title="Поделиться"
      >
        <i className="bi bi-send-check-fill" aria-hidden /> Поделиться
      </button>
      
      {showMenu && (
        <div className="share-menu">
          <button className="share-menu-item" onClick={handleWhatsApp}>
            <span className="share-icon"><i className="bi bi-chat-heart-fill" aria-hidden /></span>
            WhatsApp
          </button>
          <button className="share-menu-item" onClick={handleTelegram}>
            <span className="share-icon"><i className="bi bi-send-check-fill" aria-hidden /></span>
            Telegram
          </button>
          <button className="share-menu-item" onClick={handleCopyLink}>
            <span className="share-icon"><i className="bi bi-link-45deg" aria-hidden /></span>
            {copied ? 'Скопировано!' : 'Скопировать ссылку'}
          </button>
        </div>
      )}
      
      {copied && !showMenu && (
        <div className="copy-notification"><i className="bi bi-check-lg" aria-hidden /> Ссылка скопирована!</div>
      )}
    </div>
  );
};

export default ShareButton;
