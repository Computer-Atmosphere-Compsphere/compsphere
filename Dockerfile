# ============================================================
# Multi-stage Dockerfile for Compsphere API
# Used by Railway (and optionally Fly.io / Docker self-host)
# ============================================================

# ── Stage 1: Build ───────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests first (better layer caching)
COPY package*.json ./
COPY packages/types/package.json packages/types/
COPY packages/db/package.json         packages/db/
COPY apps/api/package.json            apps/api/

# Install all dependencies
RUN npm install

# Copy source
COPY packages/ packages/
COPY apps/api/ apps/api/

# Build in dependency order
RUN npm run build -w packages/types
RUN npm run build -w packages/db
RUN npm run build -w apps/api

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Only copy what's needed to run
COPY --from=builder /app/node_modules          ./node_modules
COPY --from=builder /app/apps/api/dist         ./apps/api/dist
COPY --from=builder /app/packages/db/dist      ./packages/db/dist
COPY --from=builder /app/packages/types/dist   ./packages/types/dist

# Create uploads directory (used if STORAGE_PROVIDER is not hostinger)
RUN mkdir -p /app/uploads

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/health || exit 1

CMD ["node", "apps/api/dist/index.cjs"]

