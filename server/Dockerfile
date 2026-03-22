#Build 
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/

ENV HUSKY=0
RUN npm pkg delete scripts.prepare
RUN npm ci

COPY server/ ./server/

WORKDIR /app/server
RUN npm run build

#Production 
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
COPY server/package*.json ./server/

ENV HUSKY=0
RUN npm pkg delete scripts.prepare
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/server/dist ./server/dist

USER appuser

EXPOSE 5000

CMD ["node", "server/dist/server.js"]