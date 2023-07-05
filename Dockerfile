FROM node:14-alpine
LABEL name="openlive-backend-dev"
WORKDIR /app
COPY package.json package-lock.json* ./
RUN chown -R node:node .
USER node
RUN npm ci --silent
COPY --chown=node:node . .

RUN npm run build \
  && npm prune
CMD ["npm", "run", "start"]
