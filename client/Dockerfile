# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

ENV HUSKY=0
RUN npm pkg delete scripts.prepare
RUN npm ci

COPY . .
RUN npm run build          # tsc -b && vite build → outputs to dist/

FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]