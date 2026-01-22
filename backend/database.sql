-- SQL скрипт для создания базы данных
-- Выполните этот скрипт в PostgreSQL, если хотите создать базу данных вручную

-- Создание базы данных (выполните от имени суперпользователя postgres)
-- CREATE DATABASE authapp;

-- Подключитесь к базе данных authapp и выполните следующие команды:

-- Таблица users будет создана автоматически Sequelize при первом запуске
-- Но если хотите создать вручную, используйте следующий SQL:

CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Создание индекса для email для быстрого поиска
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
