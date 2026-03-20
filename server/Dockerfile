# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

ENV HUSKY=0
RUN npm pkg delete scripts.prepare
RUN npm ci

COPY . .
RUN npm run build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./

ENV HUSKY=0
RUN npm pkg delete scripts.prepare
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER appuser

EXPOSE 3000

CMD ["node", "dist/server.js"]