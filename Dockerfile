FROM node:20-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package and prisma schema to install and generate client
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# 2. Rebuild the source code only when needed
FROM base AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client & Build Next.js
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install prisma CLI globally for startup migrations
RUN npm install -g prisma

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Make sure the dev.db file is accessible/writable
RUN mkdir -p /app/prisma && chown -R node:node /app/prisma
USER node

EXPOSE 3000

# Push DB changes (if any) and start server
CMD prisma db push --schema=/app/prisma/schema.prisma && node server.js
