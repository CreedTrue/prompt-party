# Build stage for Next.js frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy frontend files
COPY package*.json ./
COPY app ./app
COPY components ./components
COPY public ./public
COPY next.config.js ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.mjs ./

# Install dependencies and build
RUN npm install
RUN npm run build

# Build stage for backend server
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copy server files
COPY server/package*.json ./
COPY server/index.js ./

# Install dependencies
RUN npm install

# Final stage
FROM node:18-alpine AS runner

WORKDIR /app

# Copy built frontend
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/package*.json ./
COPY --from=frontend-builder /app/node_modules ./node_modules

# Copy backend
COPY --from=backend-builder /app/index.js ./index.js
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package*.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Start the server
CMD ["node", "index.js"] 