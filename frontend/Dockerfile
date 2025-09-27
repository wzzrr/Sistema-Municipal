# --- build static site ---
#FROM node:20-alpine AS build
#WORKDIR /web
#COPY package.json ./
#RUN npm install
#COPY tsconfig.json vite.config.ts babel.config.cjs index.html ./
#COPY src ./src
#RUN npm run build
    
# --- nginx runtime ---
#FROM nginx:alpine
#COPY --from=build /web/dist /usr/share/nginx/html
#COPY nginx.conf /etc/nginx/conf.d/default.conf
#EXPOSE 80

# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /web
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json vite.config.ts babel.config.cjs index.html ./
COPY src ./src
RUN npm run build

# --- runtime ---
FROM nginx:alpine
COPY --from=build /web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf