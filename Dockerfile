# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build


# Production stage (non-root)
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Create non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built app from builder stage
COPY --from=builder /app /app

# Set ownership of app directory
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 6000

# Start the application
CMD ["npm", "run", "start:dev"]
