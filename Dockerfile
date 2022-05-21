FROM node:16.15-alpine
WORKDIR /app
COPY package.json package-lock.json .
RUN npm ci
COPY .env .
COPY /src .
RUN npm run build
RUN npm ci --production
CMD [ "node", "App.js" ]