# services/control-plane/Dockerfile
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

# Copy source
COPY src ./src
COPY tsconfig.json ./

EXPOSE 3001
CMD ["bun", "src/index.ts"]
