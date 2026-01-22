# Система авторизации React + Node.js

Полнофункциональная система авторизации с React frontend и Node.js backend.

## Структура проекта

```
.
├── backend/          # Node.js backend с Express и PostgreSQL
│   ├── config/       # Конфигурация базы данных
│   ├── models/       # Модели данных (User)
│   ├── routes/       # API маршруты (auth)
│   ├── middleware/   # Middleware (auth)
│   └── server.js     # Главный файл сервера
└── frontend/         # React frontend
    ├── src/
    │   ├── components/   # React компоненты
    │   ├── context/      # Context API (AuthContext)
    │   └── App.js        # Главный компонент
    └── public/
```

## Технологии

### Backend
- Node.js + Express
- PostgreSQL + Sequelize
- JWT (JSON Web Tokens) для авторизации
- bcryptjs для хеширования паролей
- CORS для работы с frontend

### Frontend
- React 18
- React Router для навигации
- Axios для HTTP запросов
- Context API для управления состоянием

## Установка и запуск

### 1. Установка зависимостей Backend

```bash
cd backend
npm install
```

### 2. Настройка Backend

Создайте файл `.env` в папке `backend/` на основе `env.example`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=authapp
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

**Важно:** Убедитесь, что PostgreSQL запущен на вашем компьютере. Если PostgreSQL не установлен:
- Установите PostgreSQL локально (https://www.postgresql.org/download/)
- Создайте базу данных: `CREATE DATABASE authapp;`
- Или используйте облачный сервис (например, Heroku Postgres, AWS RDS, или Supabase)

### 3. Запуск Backend

```bash
cd backend
npm start
# или для разработки с автоперезагрузкой:
npm run dev
```

Сервер запустится на `http://localhost:5000`

### 4. Установка зависимостей Frontend

```bash
cd frontend
npm install
```

### 5. Запуск Frontend

```bash
cd frontend
npm start
```

Приложение откроется в браузере на `http://localhost:3000`

## Использование

1. **Регистрация**: Перейдите на `/register` и создайте новый аккаунт
2. **Вход**: Используйте `/login` для входа в существующий аккаунт
3. **Dashboard**: После успешной авторизации вы попадете на защищенную страницу `/dashboard`

## API Endpoints

### POST `/api/auth/register`
Регистрация нового пользователя

**Body:**
```json
{
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "Иван Иванов",
    "email": "ivan@example.com"
  }
}
```

### POST `/api/auth/login`
Вход пользователя

**Body:**
```json
{
  "email": "ivan@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "Иван Иванов",
    "email": "ivan@example.com"
  }
}
```

### GET `/api/auth/me`
Получение информации о текущем пользователе (требует авторизации)

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "name": "Иван Иванов",
    "email": "ivan@example.com"
  }
}
```

## Безопасность

- Пароли хешируются с помощью bcryptjs перед сохранением в базу данных
- JWT токены используются для аутентификации
- Токены хранятся в localStorage (для production рекомендуется использовать httpOnly cookies)
- Валидация данных на стороне сервера

## Примечания

- Для production окружения обязательно измените `JWT_SECRET` на сложный случайный ключ
- Настройте CORS для вашего домена в production
- Рассмотрите возможность использования httpOnly cookies вместо localStorage для токенов
