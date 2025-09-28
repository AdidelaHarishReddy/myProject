FROM node:alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
# Build arguments for environment variables
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL:-http://localhost:8000}
RUN echo "Building frontend with API URL: $REACT_APP_API_BASE_URL"
RUN npm run build

FROM nginx:latest
COPY --from=build /app/build /usr/share/nginx/html
# Add a script to overwrite env.js dynamically
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]