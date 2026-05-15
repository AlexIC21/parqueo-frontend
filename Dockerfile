FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build del proyecto Ionic/Angular
RUN npx ionic build --project parqueo-frontend --configuration production

# Buscar automáticamente dónde quedó el index.html dentro de dist
RUN mkdir -p /app/static && \
    BUILD_DIR=$(dirname "$(find /app/dist -name index.html | head -n 1)") && \
    echo "Build encontrado en: $BUILD_DIR" && \
    cp -r "$BUILD_DIR"/* /app/static/

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/static /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]