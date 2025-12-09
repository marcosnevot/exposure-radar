# docker/backend.Dockerfile

# --- Build stage -----------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend metadata and config
COPY backend/package*.json backend/tsconfig*.json backend/nest-cli.json backend/tsconfig.build.json ./backend/
COPY backend/prisma ./backend/prisma
COPY backend/prisma.config.ts ./backend/prisma.config.ts
COPY backend/src ./backend/src

WORKDIR /app/backend

# Install dependencies
RUN npm install

# Prisma generate (uses a dummy DATABASE_URL just for generation)
ENV DATABASE_URL="postgresql://placeholder/placeholder"
RUN npx prisma generate

# Build NestJS app
RUN npm run build

# --- Runtime stage --------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app/backend

ENV NODE_ENV=production

# Copy node_modules and built artifacts from builder
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/backend/generated ./generated
COPY backend/package*.json ./

EXPOSE 4000

# Default command: start compiled NestJS app
CMD ["node", "dist/src/main.js"]
