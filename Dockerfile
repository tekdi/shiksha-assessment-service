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
    
    # If in production, build the app
    RUN if [ "$NODE_ENV" = "production" ]; then npm run build; fi
    
    
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
    
    EXPOSE 3000
    CMD ["node", "dist/main.js"]
    