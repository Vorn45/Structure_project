# Stage 1
FROM node:20-alpine as node

# Get Variables
ARG API_BASE_URL
ARG FILE_BASE_URL
ARG SOCKET_URL
# ARG RecaptchaSiteKey


WORKDIR /usr/app

COPY ./package.json /usr/app/package.json

# Install Dependencies
RUN npm install --legacy-peer-deps

COPY ./ /usr/app

# Build
RUN npm run build --prod

# Stage 2
FROM nginx:alpine

COPY --from=node /usr/app/default.conf /etc/nginx/conf.d/default.conf

COPY --from=node /usr/app/dist /usr/share/nginx/html
