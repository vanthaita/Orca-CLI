# Base stage
FROM node:22-alpine AS base
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package*.json ./
RUN npm install

# Build stage
FROM dependencies AS build
COPY . .
RUN npm run build

# Production stage
FROM base AS production
COPY package*.json ./
RUN npm install --only=production
COPY --from=build /app/dist ./dist

EXPOSE 8000
CMD ["npm", "run", "start:prod"]
