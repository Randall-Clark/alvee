FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy workspace root config files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all workspace package.json files needed for pnpm workspace resolution
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/ ./lib/

# Install api-server dependencies
RUN pnpm install --no-frozen-lockfile --filter @workspace/api-server...

# Copy api-server source code
COPY artifacts/api-server/ ./artifacts/api-server/

# Build the api-server
RUN pnpm --filter @workspace/api-server run build

CMD ["pnpm", "--filter", "@workspace/api-server", "run", "start"]
