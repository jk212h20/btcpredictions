# Dockerfile for Manifold Web Frontend
# Builds and serves the Next.js application

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy root package files
COPY package.json yarn.lock ./
COPY web/package.json ./web/
COPY common/package.json ./common/
COPY client-common/package.json ./client-common/

# Install dependencies
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/web/node_modules ./web/node_modules
COPY --from=deps /app/common/node_modules ./common/node_modules
COPY --from=deps /app/client-common/node_modules ./client-common/node_modules

# Copy source code
COPY common ./common
COPY client-common ./client-common
COPY web ./web
COPY package.json yarn.lock ./

# Build common first, then web
WORKDIR /app/common
RUN yarn build || true

WORKDIR /app/web

# Set build-time environment variables
ARG NEXT_PUBLIC_FIREBASE_ENV=PROD
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_FIREBASE_ENV=${NEXT_PUBLIC_FIREBASE_ENV}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN yarn build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/web/public ./web/public
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/static ./web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "web/server.js"]
