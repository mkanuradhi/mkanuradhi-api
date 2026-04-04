# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install ALL dependencies (including devDependencies for tsc)
RUN npm ci

# Copy source and compile TypeScript
COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Create logs directory and give ownership to node user
RUN mkdir -p logs && chown -R node:node /app

# Don't run as root
USER node

EXPOSE 5000

CMD ["node", "dist/src/app.js"]