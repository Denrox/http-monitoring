FROM node:alpine

WORKDIR /app

COPY . .
RUN npm install

# Define the command to run the app
CMD [ "node", "index.js", "--config=./config.json" ]