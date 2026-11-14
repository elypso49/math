# syntax=docker/dockerfile:1.6

# ----- Stage 1 : build the SPA -----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Build-time env vars inlined into the bundle by Vite. The image always talks to
# MltStore (VITE_DATA_MODE=mltstore); the other two are optional:
# without VITE_MLTSTORE_URL the app calls /api same-origin, proxied by nginx.
ARG VITE_MLTSTORE_URL
ENV VITE_MLTSTORE_URL=$VITE_MLTSTORE_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ARG VITE_DATA_MODE=mltstore
ENV VITE_DATA_MODE=$VITE_DATA_MODE

COPY . .
RUN npm run build

# ----- Stage 2 : runtime -----
FROM nginx:1.27-alpine

RUN apk add --no-cache wget

COPY --from=builder /app/dist /usr/share/nginx/html

RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s \
  CMD wget -q --spider http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
