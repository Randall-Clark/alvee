FROM node:20-slim

WORKDIR /app

# Install pnpm reliably via npm
RUN npm install -g pnpm@10

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all package.json files needed for workspace resolution
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/api-spec/package.json ./lib/api-spec/ 2>/dev/null || true
COPY lib/api-zod/package.json ./lib/api-zod/ 2>/dev/null || true
COPY lib/db/package.json ./lib/db/ 2>/dev/null || true
COPY lib/api-client-react/package.json ./lib/api-client-react/ 2>/dev/null || true

# Install dependencies for api-server only
RUN pnpm install --frozen-lockfile --filter @workspace/api-server...

# Copy source code
COPY artifacts/api-server/ ./artifacts/api-server/
COPY lib/ ./lib/

# Build the api-server
RUN pnpm --filter @workspace/api-server run build

EXPOSE 8080

CMD ["pnpm", "--filter", "@workspace/api-server", "run", "start"]
