FROM node:alpine AS build
WORKDIR /app
COPY package.json ./
COPY .env ./
RUN npm install
COPY . .
RUN npm run build
ENV REACT_APP_API_BASE_URL=http://localhost:8000
FROM nginx:latest
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

 
