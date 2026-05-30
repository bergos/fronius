FROM node:24-slim

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

USER node

ENTRYPOINT ["node", "/app/bin/fronius.js"]