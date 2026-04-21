# Stage 1: Build
FROM node:22-alpine AS builder

ARG VITE_API_URL
ARG VITE_TRASCK_API_BASE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_TRASCK_API_BASE_URL=$VITE_TRASCK_API_BASE_URL

WORKDIR /trasck-frontend

COPY package.json package-lock.json* ./
RUN npm ci

COPY public ./public
COPY src ./src
COPY index.html ./index.html
COPY vite.config.js ./vite.config.js
RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine

COPY --from=builder /trasck-frontend/dist /usr/share/nginx/html

ENV TRASCK_CSP_CONNECT_SRC="'self' http://localhost:6100"
ENV TRASCK_CSP_IMG_SRC="'self' data: https:"
ENV TRASCK_CSP_STYLE_SRC="'self' 'unsafe-inline'"
ENV TRASCK_CSP_SCRIPT_SRC="'self'"
ENV NGINX_SERVER_NAME="localhost"

COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

# Start NGINX server
CMD ["nginx", "-g", "daemon off;"]
