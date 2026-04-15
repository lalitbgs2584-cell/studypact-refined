FROM node:22-alpine AS base

# Install python/make for potential node-gyp builds and libc6-compat
RUN apk add --no-cache libc6-compat python3 make g++

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 1. Install dependencies
FROM base AS deps
WORKDIR /app
# Copy package definition and workspace files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY prisma ./prisma

# Install all dependencies (development dependencies are needed for ts-node build)
RUN pnpm install --frozen-lockfile

# 2. Rebuild the source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js application & generate Prisma client
RUN pnpm run build

# 3. Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Because this runs a custom server.ts with ts-node in production,
# we copy the entire built workspace & dependencies to ensure runtime success
COPY --from=builder /app ./

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Note: The start script in package.json uses ts-node to run server.ts
CMD ["pnpm", "start"]
