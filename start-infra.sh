NETWORK=services

docker network create -d bridge $NETWORK

docker run -d \
  --network=$NETWORK \
	--name=consul \
	-p 8500:8500 \
  -p 8600:8600 \
	-e "SERVICE_IGNORE=true" \
	consul

docker run -d \
	--name=registrator \
	--net=host \
	--volume=/var/run/docker.sock:/tmp/docker.sock \
	gliderlabs/registrator -internal consul://localhost:8500

docker run -d \
  --network=$NETWORK \
	--name=traefik \
	-p 80:80 \
	-p 8080:8080 \
	-v $PWD/traefik.toml:/traefik.toml \
	-e "SERVICE_IGNORE=true" \
	containous/traefik:experimental

docker run -d \
  --network=$NETWORK \
  --name=rabbitmq \
  -p 15672:15672 \
  -p 5672:5672 \
  -e "SERVICE_IGNORE=true" \
  rabbitmq
