# services/runtime/Dockerfile
# Build context must be the repo root (not services/runtime/)
# because we need to COPY packages/connector-sdk and packages/workflow-schema

FROM oven/bun:1-alpine AS base
WORKDIR /app

# Copy shared packages needed by tsconfig path aliases
COPY packages/connector-sdk ./packages/connector-sdk
COPY packages/workflow-schema ./packages/workflow-schema

# Install runtime dependencies
COPY services/runtime/package.json services/runtime/bun.lockb* ./services/runtime/
RUN cd services/runtime && bun install --frozen-lockfile --production

# Copy source
COPY services/runtime/src ./services/runtime/src
COPY services/runtime/tsconfig.json ./services/runtime/

WORKDIR /app/services/runtime
CMD ["bun", "src/index.ts"]
