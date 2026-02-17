# Запуск CarPro в Docker

## Требования

- Docker и Docker Compose установлены на машине.
- **PostgreSQL установлен и запущен на вашем компьютере** (не в Docker). Бэкенд в контейнере подключается к нему по сети.

## Подготовка PostgreSQL на компьютере

1. Убедитесь, что PostgreSQL запущен (порт 5432).
2. Создайте базу и пользователя, если нужно, или используйте существующие. Бэкенд по умолчанию подключается к:
   - хост: локальный PostgreSQL (из контейнера используется `host.docker.internal`)
   - порт: 5432
   - база: `authapp` (создаётся автоматически при первом запуске, если настроен `createDatabaseIfNotExists`)
   - пользователь: `postgres`
   - пароль: `postgres`

При других настройках задайте переменные в файле `.env` в корне проекта (см. ниже).

## Запуск

В корне проекта выполните:

```bash
docker-compose up --build
```

Первый запуск может занять несколько минут (сборка образов).

После старта:

- **Сайт:** http://localhost (порт 80)
- **MinIO S3 API:** http://localhost:9000
- **MinIO Web Console:** http://localhost:9001 (логин/пароль — см. переменные `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`)

## Остановка

```bash
docker-compose down
```

Загрузки (фото машин) хранятся в томе `backend_uploads`, данные MinIO — в томе `minio_data`. Чтобы удалить и их:

```bash
docker-compose down -v
```

## Переменные окружения

В корне проекта можно создать файл `.env` и задать:

| Переменная      | Описание                          | По умолчанию           |
|-----------------|-----------------------------------|------------------------|
| `DB_HOST`       | Хост PostgreSQL на вашем ПК      | `host.docker.internal` |
| `DB_PORT`       | Порт PostgreSQL                  | `5432`                 |
| `DB_NAME`       | Имя базы данных                  | `authapp`              |
| `DB_USER`       | Пользователь PostgreSQL          | `postgres`             |
| `DB_PASSWORD`   | Пароль PostgreSQL                | `postgres`             |
| `JWT_SECRET`    | Секрет для JWT                   | (значение в compose)   |
| `MINIO_ROOT_USER` | Логин MinIO (консоль и S3)     | `minioadmin`           |
| `MINIO_ROOT_PASSWORD` | Пароль MinIO               | `minioadmin`           |
| `MINIO_BUCKET`  | Имя бакета для загрузок (если бэкенд использует MinIO) | `carpro-uploads` |

**На Linux:** если `host.docker.internal` не работает, задайте `DB_HOST=172.17.0.1` или IP вашего хоста в сети Docker.
