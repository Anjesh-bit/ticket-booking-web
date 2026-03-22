#  Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/

ENV HUSKY=0
RUN npm pkg delete scripts.prepare
RUN npm ci

COPY client/ ./client/

WORKDIR /app/client
RUN npm run build

#  Production (nginx) 
FROM nginx:alpine AS production

COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]