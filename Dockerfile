# Build stage for Next.js frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy frontend files
COPY package*.json ./
COPY app ./app
COPY components ./components
COPY public ./public
COPY lib ./lib
COPY next.config.js ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.mjs ./
COPY server.js ./

# Install dependencies and build
RUN npm install
RUN npm run build

# Final stage
FROM node:18-alpine AS runner

WORKDIR /app

# Copy built frontend and server
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/package*.json ./
COPY --from=frontend-builder /app/node_modules ./node_modules
COPY --from=frontend-builder /app/server.js ./
COPY --from=frontend-builder /app/next.config.js ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Start the server
CMD ["node", "server.js"] 