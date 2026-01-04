# Base stage
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package*.json ./
RUN npm install

# Build stage
FROM dependencies AS build
COPY . .
# Add build-time arguments for environment variables
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build

# Production stage
FROM base AS production
COPY package*.json ./
RUN npm install --only=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./
# For Next.js, we might need more files depending on the setup (standalone or not)
# But a standard next build/start works too if we copy enough.

EXPOSE 3000
CMD ["npm", "run", "start"]
