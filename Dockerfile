# Docker Hub is blocked (403) on the server, so base images come from a mirror.
# Override if the mirror is down:  NODE_IMAGE=... NGINX_IMAGE=... docker compose up --build -d
ARG NODE_IMAGE=docker.arvancloud.ir/node:20-alpine
ARG NGINX_IMAGE=docker.arvancloud.ir/nginx:1.27-alpine
FROM ${NODE_IMAGE} AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install


ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_EVENT_LANDING_BASE_URL
ENV VITE_EVENT_LANDING_BASE_URL=$VITE_EVENT_LANDING_BASE_URL

COPY index.html vite.config.ts tsconfig*.json eslint.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM ${NGINX_IMAGE}
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80

