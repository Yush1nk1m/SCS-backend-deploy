# Step 1: Build the NestJS application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy all source files
COPY . .

# Build the application
RUN npm run build

# Step 2: Create a new image with only the necessary files for production
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy built files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.env.production ./.env.production

# Expose the port the app runs on
EXPOSE 4000

# Set environment variables from .env file
# Note: You cannot directly read .env in Dockerfile
# You need to pass them when running the container

# Start the application with PM2 in cluster mode
CMD ["pm2-runtime", "start", "npm", "--name", "scs-app", "--", "run", "start:prod"]
