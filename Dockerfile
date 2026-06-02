# ---------- Builder Stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build NestJS application
RUN npm run build

# ---------- Development Stage ----------
FROM node:20-alpine AS development

WORKDIR /app

ENV NODE_ENV=development

COPY --from=builder /app /app

EXPOSE 6000

CMD ["npm", "run", "start:dev"]

# ---------- Production Stage ----------
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only what is needed from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Optional: remove dev dependencies to reduce image size
RUN npm prune --omit=dev && \
    chown -R appuser:appgroup /app

USER appuser

ENV PORT=6000
EXPOSE 6000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "const port = process.env.PORT || 6000; require('http').get('http://127.0.0.1:' + port + '/health/ready', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

CMD ["node", "dist/main.js"]
