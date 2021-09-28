FROM node:alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY .env .
COPY /src .
RUN npx tsc ./App.ts
CMD [ "node", "App.js" ]