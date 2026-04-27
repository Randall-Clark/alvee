FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy workspace root config files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all workspace package.json files
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY lib/api-client-react/package.json ./lib/api-client-react/

# Install all workspace dependencies (no frozen to avoid lockfile mismatch)
RUN pnpm install --no-frozen-lockfile --filter @workspace/api-server...

# Copy source code
COPY artifacts/api-server/ ./artifacts/api-server/
COPY lib/ ./lib/

# Build the api-server
RUN pnpm --filter @workspace/api-server run build

CMD ["pnpm", "--filter", "@workspace/api-server", "run", "start"]
