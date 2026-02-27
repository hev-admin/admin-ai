# ---- Stage 1: Build ----
FROM node:18-slim AS build

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace config and lockfile first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/frontend/package.json packages/frontend/
COPY packages/backend/package.json packages/backend/
COPY docs/package.json docs/

# Install all dependencies (including devDependencies needed for build)
RUN pnpm install --frozen-lockfile

# Copy the full source
COPY . .

# Generate Prisma client
RUN pnpm --filter backend run db:generate

# Build frontend
RUN pnpm --filter frontend build

# Build docs
RUN pnpm --filter docs build

# ---- Stage 2: Production ----
FROM node:18-slim AS production

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/backend/package.json packages/backend/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod --filter backend

# Copy backend source
COPY packages/backend/src packages/backend/src/
COPY packages/backend/prisma packages/backend/prisma/

# Generate Prisma client in production image
RUN pnpm --filter backend run db:generate

# Copy built frontend assets to be served as static files
COPY --from=build /app/packages/frontend/dist packages/frontend/dist/

# Copy built docs
COPY --from=build /app/docs/.vitepress/dist docs/.vitepress/dist/

# Create directory for SQLite database
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

WORKDIR /app/packages/backend

CMD ["node", "src/index.js"]
