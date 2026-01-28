# Исправление проблемы с API запросами

## Проблема
Запросы шли на `localhost:3000` вместо `localhost:5000`, что вызывало ошибку 404.

## Решение

### 1. Добавлен Proxy в package.json
```json
{
  "proxy": "http://localhost:5000"
}
```

### 2. Исправлен baseURL в AuthContext.js
**Было:**
```javascript
axios.defaults.baseURL = 'http://localhost:5000/api';
```

**Стало:**
```javascript
axios.defaults.baseURL = 'http://localhost:5000';
```

### 3. Исправлены все запросы без префикса `/api/`

**Исправленные файлы:**
- `CarsList.js`: `/cars` → `/api/cars`
- `CarsList.js`: `/cars/favorites/list` → `/api/cars/favorites/list`
- `CarsList.js`: `/cart` → `/api/cart`
- `Cart.js`: `/cart` → `/api/cart`
- `Cart.js`: `/cart/checkout` → `/api/cart/checkout`
- `SellCar.js`: `/cars/sell` → `/api/cars/sell`
- `Profile.js`: `/cars/favorites/list` → `/api/cars/favorites/list`
- `Profile.js`: `/auth/purchase-history` → `/api/auth/purchase-history`
- `Profile.js`: `/auth/profile` → `/api/auth/profile`
- `Map.js`: `/cars` → `/api/cars`
- `AdminPanel.js`: `/admin/cars` → `/api/admin/cars`
- `AdminPanel.js`: `/admin/users` → `/api/admin/users`
- `AuthContext.js`: `/auth/me` → `/api/auth/me`
- `AuthContext.js`: `/auth/login` → `/api/auth/login`
- `AuthContext.js`: `/auth/register` → `/api/auth/register`

## Как это работает теперь

### С Proxy:
- Запрос: `axios.get('/api/cars/6')`
- Proxy перенаправляет: `localhost:3000/api/cars/6` → `localhost:5000/api/cars/6`

### С baseURL:
- baseURL: `http://localhost:5000`
- Запрос: `axios.get('/api/cars/6')`
- Итоговый URL: `http://localhost:5000/api/cars/6`

## Что нужно сделать

1. **Перезапустить frontend сервер** (npm start)
2. **Убедиться, что backend работает на порту 5000**
3. **Проверить в браузере (F12 → Network)**, что запросы идут на `localhost:5000`

## Проверка

Откройте браузер → F12 → Network → попробуйте открыть автомобиль
Должно быть:
- Request URL: `http://localhost:5000/api/cars/6` ✅
- Status: 200 OK ✅
