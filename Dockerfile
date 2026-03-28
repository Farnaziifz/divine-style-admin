FROM mirror2.chabokan.net/node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm config set registry https://mirror2.chabokan.net/npm/

RUN npm install


ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY index.html vite.config.ts tsconfig*.json eslint.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM mirror2.chabokan.net/nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80

