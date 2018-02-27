# Docker + Consul + Registrator + Traefik

## Purpose

Setup to figure out (and demonstrate) how the combination Docker, Consul, Registrator and Traefik works.

## installation 

- make sure port 80, 8080 (traefik) && 8085 (consul) are free
- run `build.sh` in app/
- run `start-infra.sh`
- run `start-app.sh` as often as you like 
- run `curl --header 'Host: api.services.int' localhost/app/echo/kiddo`  . you will see counter that shows that load balacing works


## from inside the container

If you want to hit the load balancer from inside a docker (e.g. container to container call), you can do: `curl --header 'Host: api.services.int' traefik/app/echo/kiddo`
