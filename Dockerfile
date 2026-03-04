FROM node:20-alpine AS base

WORKDIR /app

# Stage 1: Install dependencies
FROM base AS deps

# Install build tools for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ 

# Copy package manifests
COPY package*.json ./
# Copy all packages to ensure workspaces are found
COPY packages ./packages

# Install everything including workspaces
RUN npm ci

# Stage 2: Builder
FROM base AS builder

WORKDIR /app

# Copy everything including the node_modules we just installed
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build workspaces
RUN npm run build

# Stage 3: Runner
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 mindlint

# Copy artifacts from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules

# Create data directory for SQLite database (before switching to non-root user)
RUN mkdir -p /app/packages/backend/data && chown -R mindlint:nodejs /app/packages/backend/data

USER mindlint

# The app listens on process.env.PORT || 3001
EXPOSE 3001

CMD ["npx", "tsx", "packages/backend/src/index.ts"]
