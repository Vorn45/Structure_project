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
FROM nginx:1.15.8-alpine

# Remove these lines if the files don't exist or are not necessary
# COPY --from=node /usr/app/default.conf /etc/nginx/conf.d/default.conf
# COPY --from=node /usr/app/nginx-status /usr/share/nginx/html/nginx-status

COPY --from=node /usr/app/dist /usr/share/nginx/html
