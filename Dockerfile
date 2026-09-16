# Multi-stage Docker build for Event-Driven Notification Service

# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production runtime stage
FROM node:22-alpine AS production

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3001

USER node

CMD ["node", "dist/main"]
