# ─── Stage 1: Build React app ─────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Stage 2: Production Node server ──────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install only server dependencies
COPY server/package.json ./
RUN npm install --omit=dev

# Copy server entry point and built frontend
COPY server/index.js ./
COPY --from=builder /app/dist ./public

EXPOSE 1793

ENV PORT=1793
ENV DATA_DIR=/data

CMD ["node", "index.js"]
