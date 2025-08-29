FROM node:alpine AS build
WORKDIR /app
COPY package.json ./
COPY .env ./
RUN npm install
COPY . .
###backend url#
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=http://13.127.28.234:8000
RUN echo "Building frontend with API URL: $REACT_APP_API_BASE_URL"
RUN npm run build
FROM nginx:latest
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

 
