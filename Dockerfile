# ===============================
# STAGE 1 — build
# ===============================
FROM node:18-alpine AS builder

WORKDIR /app

# Install deps first
COPY package*.json ./
RUN npm install

# Copy everything & build
COPY . .
RUN npm run build

# ===============================
# STAGE 2 — run
# ===============================
FROM node:18-alpine AS runner

WORKDIR /app

# Copy only what's needed
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.js ./next.config.js

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
