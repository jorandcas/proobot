FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache tzdata curl

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma/ ./prisma/
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/dist/ ./dist/

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD curl -sf http://localhost:3001/health || exit 1

CMD ["sh", "-c", "\
  echo '⏳ Esperando base de datos...' && \
  for i in $(seq 1 30); do \
    npx prisma migrate deploy 2>/dev/null && break; \
    echo \"  intento $i/30...\"; \
    sleep 2; \
  done && \
  echo '🚀 Iniciando servidor...' && \
  node dist/server.js \
"]