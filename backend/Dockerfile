FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Папка для загрузок (если нет — создаётся при запуске)
RUN mkdir -p uploads/cars

EXPOSE 5000

CMD ["node", "server.js"]
