FROM node:20-alpine AS base

WORKDIR /app

FROM base AS deps

COPY package*.json ./
COPY package-lock.json* ./

RUN apk add --no-cache python3 make g++ 
RUN npm ci --workspaces --if-present

FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY packages ./packages

RUN npm run build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 mindlint

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules

USER mindlint

EXPOSE 3000

CMD ["node", "packages/backend/src/index.js"]
