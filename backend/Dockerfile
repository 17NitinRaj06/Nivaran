FROM node:20-slim

RUN groupadd -r app && useradd -r -g app app

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .

ENV PORT=8080
EXPOSE 8080

USER app
CMD ["node", "server.js"]
