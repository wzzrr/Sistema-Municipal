# =========================
# 1) BUILD STAGE
# =========================
FROM node:20-alpine AS build
WORKDIR /app

# Instalar herramientas necesarias para build y debugging
RUN apk update && apk add --no-cache \
    bash \
    coreutils \
    python3 \
    py3-pip \
    git \
    curl \
    nano \
    procps

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

# Instalar herramientas básicas también en runtime (para Codex)
RUN apk update && apk add --no-cache \
    bash \
    coreutils \
    python3 \
    py3-pip \
    git \
    curl \
    nano \
    procps

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

ENV DATA_DIR=/data \
    TEMPLATE_DIR=/app/templates

# Crear directorios persistentes
RUN mkdir -p /data/uploads /data/pdfs /app/templates

# Permitir que Codex (o vos) puedas entrar al contenedor con bash
SHELL ["/bin/bash", "-c"]

EXPOSE 3000

# Comando de inicio del servidor
CMD ["node", "dist/main.js"]
