// Базовый URL API: в Docker пустой (nginx proxy), локально — через REACT_APP_API_URL или proxy
export const API_BASE = process.env.REACT_APP_API_URL || '';
// WebSocket: в Docker — тот же origin, при локальной разработке — бэкенд на :5000
export const WS_URL =
  process.env.REACT_APP_WS_URL ||
  (typeof window !== 'undefined' && process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000'
    : typeof window !== 'undefined'
    ? window.location.origin
    : '');
