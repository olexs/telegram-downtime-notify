FROM node:20.3.0-alpine
WORKDIR /app
COPY package.json package-lock.json .env ./
COPY src/* ./src/
RUN npm ci && npm run build && npm ci --omit=dev && npm cache clean --force
ARG NODE_ENV=production
USER node
CMD [ "node", "src/App.js" ]