FROM node:9

RUN apt-get update
RUN apt-get install -y vim dnsutils

EXPOSE 3000

RUN mkdir /app
WORKDIR /app
COPY . ./

RUN npm install -g nodemon && npm install

CMD node index.js
