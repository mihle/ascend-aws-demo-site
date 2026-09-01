FROM node:22.14.0-alpine3.21

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./server.js
COPY index.html styles.css app.js /site/
COPY entrypoint.sh /entrypoint.sh
RUN chmod 0555 /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
