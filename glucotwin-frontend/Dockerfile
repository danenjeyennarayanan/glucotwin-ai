# ── Stage 1: Build React app ───────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy manifests first for layer-cached dependency install
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy Tailwind/PostCSS configs (needed at build time)
COPY tailwind.config.js postcss.config.js ./

COPY public ./public
COPY src ./src

# Build args allow overriding env vars at Docker build time
ARG REACT_APP_API_BASE=http://localhost:8080
ENV REACT_APP_API_BASE=$REACT_APP_API_BASE

RUN npm run build

# ── Stage 2: Serve with nginx ──────────────────────────────────────────────
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
