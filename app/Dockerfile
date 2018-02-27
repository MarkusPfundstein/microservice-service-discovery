FROM node:9

RUN mkdir /app
WORKDIR /app
COPY . ./

EXPOSE 3000

RUN apt-get update
RUN apt-get install -y vim
RUN npm install

CMD node index.js
