# ---------- Base Builder ----------
    FROM node:20-alpine AS base

    WORKDIR /app
    COPY package*.json ./
    
    # Default to production if not provided
    ARG NODE_ENV=development
    ENV NODE_ENV=$NODE_ENV
    
    # Install based on environment
    RUN if [ "$NODE_ENV" = "development" ]; then \
          npm install; \
        else \
          npm install --omit=dev; \
        fi
    
    COPY . .
    
    RUN npm run build
    
    
    # ---------- Development Runtime ----------
    FROM node:20-alpine AS development
    
    WORKDIR /app
    ENV NODE_ENV=development
    
    COPY --from=base /app /app
    
    # Hot reload (optional)
    CMD ["npm", "run", "start:dev"]
    
    
    # ---------- Production Runtime ----------
    FROM node:20-alpine AS production
    
    WORKDIR /app
    ENV NODE_ENV=production
    
    # Add non-root user
    RUN addgroup -S appgroup && adduser -S appuser -G appgroup
    
    COPY --from=base /app/dist ./dist
    COPY --from=base /app/package*.json ./
    
    RUN npm install --omit=dev && chown -R appuser:appgroup /app
    
    USER appuser
    
    # Set default port (can be overridden via environment variable)
    ENV PORT=6000
    EXPOSE 6000
    
    # Health check for Docker - checks if service and database are ready
    HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
      CMD node -e "const port = process.env.PORT || 6000; require('http').get('http://127.0.0.1:' + port + '/health/ready', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"
    
    CMD ["node", "dist/main.js"]
    
