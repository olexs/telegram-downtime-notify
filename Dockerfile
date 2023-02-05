FROM node:18.14-alpine
WORKDIR /app
COPY package.json package-lock.json .env ./
COPY src/* ./src/
RUN npm ci && npm run build && npm ci --production && npm cache clean --force
ARG NODE_ENV=production
USER node
CMD [ "node", "src/App.js" ]