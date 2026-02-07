# ─── Build Stage ──────────────────────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install all dependencies (including devDependencies for build)
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build frontend
RUN bun run build

# ─── Production Stage ─────────────────────────────────────────────────────
FROM oven/bun:1-slim

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install production dependencies only
RUN bun install --frozen-lockfile --production

# Copy server code
COPY server/ ./server/

# Copy shared game logic (used by server)
COPY src/lib/gameLogic.js ./src/lib/gameLogic.js

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3100

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost:3100/api/health || exit 1

# Run the server
CMD ["bun", "run", "server/index.ts"]
