# Сборка React
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# В Docker сборка без REACT_APP_API_URL — запросы идут на тот же origin (nginx проксирует)
RUN npm run build

# Образ с nginx для раздачи статики
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
