# =========================
# 1) BUILD STAGE
# =========================
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src ./src

RUN npx nest build

# =========================
# 2) RUNTIME STAGE
# =========================
FROM node:20-alpine AS runtime
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

ENV DATA_DIR=/data \
    TEMPLATE_DIR=/app/templates
RUN mkdir -p /data/uploads /data/pdfs /app/templates

EXPOSE 3000
CMD ["node", "dist/main.js"]
