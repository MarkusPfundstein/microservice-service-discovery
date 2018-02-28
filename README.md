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

## hit traefik from inside the container

If you want to hit the load balancer from inside a docker (e.g. container to container call), you can do: `curl traefik/app/echo/kiddo`

Note that this solution is not really nice. Usually we would want consul to handle DNS or have an internal lb for inter-service request (To-DO)

## Run development instance of app microservice

To run a development instance on the environment next to the others, but away from the load balancers, you can easily startup a new docker. Note that you must give it a separate tag, otherwise Traefik will not be able to distinguish.

```
cd app/
docker build -t testapp ./
docker run -it \
    --network=services \
    -e "SERVICE_TAGS=traefik.frontend.passHostHeader=true,traefik.frontend.rule=PathPrefixStrip:/test" \
    -P \
    testapp
```

You can now query it with `curl localhost/test/echo/dev-kid`. 
