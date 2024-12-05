FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

# Copy local code to the container image.
COPY . ./

# Run the web service on container startup.
CMD [ "node", "index.js" ]