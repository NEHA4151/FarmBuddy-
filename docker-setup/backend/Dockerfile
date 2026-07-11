FROM node:20

WORKDIR /app/server

COPY server/package*.json ./

RUN npm install

COPY server/ .

EXPOSE 5000

CMD ["node", "server.js"]