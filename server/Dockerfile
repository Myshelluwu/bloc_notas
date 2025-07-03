FROM node:16
WORKDIR /usr/server/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server/server.js"]