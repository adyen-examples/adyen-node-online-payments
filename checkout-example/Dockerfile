FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# Copy the source files into the image
COPY . .

CMD [ "npm", "start" ]
