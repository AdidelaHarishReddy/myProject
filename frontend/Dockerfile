FROM node:alpine AS build
WORKDIR /app
COPY package.json ./
COPY .env ./
RUN npm install
COPY . .
RUN npm run build
FROM nginx:latest
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

 
