FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install root dependencies
RUN --mount=type=cache,id=cache-npm-cache,target=/root/.npm npm ci --production=false

# Copy server and install its dependencies
COPY server/ ./server/
WORKDIR /app/server
RUN --mount=type=cache,id=cache-npm-cache,target=/root/.npm npm ci --production=false

# Copy client and install its dependencies
WORKDIR /app
COPY client/ ./client/
WORKDIR /app/client
RUN --mount=type=cache,id=cache-npm-cache,target=/root/.npm npm ci --production=false

# Build client
RUN --mount=type=cache,id=cache-npm-cache,target=/root/.npm npm run build

# Copy client build to server public directory
RUN mkdir -p ../server/public && cp -r build/* ../server/public/

# Set working directory back to server
WORKDIR /app/server

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]