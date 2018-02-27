# Docker + Consul + Registrator + Traefik

0. make sure port 80, 8080 (traefik) && 8085 (consul) are free
1. run build.sh in app/
2. run start-consul-and-registrator.sh
3. run start-app.sh as often as you want
4. run curl localhost:80/app/echo/hello  . you will see counter that shows that load balacing works



