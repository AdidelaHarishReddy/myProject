FROM node:alpine AS build
WORKDIR /app
COPY package*.json ./
# Prefer reproducible installs; fall back if no lockfile.
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund
COPY . .
# Build arguments for environment variables
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL:-http://localhost:8000}
ENV NODE_ENV=production
ENV CI=true
RUN echo "Building frontend with API URL: $REACT_APP_API_BASE_URL"
RUN npm run build

FROM nginx:latest
COPY --from=build /app/build /usr/share/nginx/html
# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Add a script to overwrite env.js dynamically
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
