# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Set VITE_API_URL from build arguments (Vite bakes env vars into build output)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Remove default configuration and copy custom SPA nginx configuration
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output to serve
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
