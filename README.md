# Docker + Consul + Registrator + Traefik + RabbitMQ + Node

## Purpose

Setup to figure out (and demonstrate) how the combination Docker, Consul, Registrator, Node, RabbitMQ and Traefik works.

## installation 

- make sure ports 80 (traefik lb), 8080 (traefik gui), 8085 (consul), 8080 (consul gui), 5672 (rabbitm) and 15672 (rabbitmq GUI) are available on your system
- run `docker build -t app ./` in app/
- run `docker build -t rabbitmq ./` in rabbitmq/
- run `start-infra.sh`
- run `start-app.sh` as often as you like to start multiple app instances
- run `curl localhost/app/echo/kiddo`  . you will see counter that shows that load balacing works

If you want to post a message to rabbitmq, log in to management app localhost:15672 with username/password combo user/user. Navigate to queue `app` and publish a message. It will be round robined to your apps 

## from inside the container

If you want to hit the load balancer from inside a docker (e.g. container to container call), you can do: `curl traefik/app/echo/kiddo`
