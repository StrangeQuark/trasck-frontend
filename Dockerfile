# Stage 1: Build
FROM node:22-alpine AS builder

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /trasck-frontend

COPY package.json package-lock.json* ./
RUN npm install

COPY public ./public
COPY src ./src
COPY index.html ./index.html
COPY vite.config.js ./vite.config.js
RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine

COPY --from=builder /trasck-frontend/dist /usr/share/nginx/html

# Replace default nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Start NGINX server
CMD ["nginx", "-g", "daemon off;"]