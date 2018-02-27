docker run -d \
	--name=consul \
	-p 8500:8500 \
	-e "SERVICE_IGNORE=true" \
	consul

docker run -d \
	--name=registrator \
	--net=host \
	--volume=/var/run/docker.sock:/tmp/docker.sock \
	gliderlabs/registrator -internal consul://localhost:8500

docker run -d \
	--name=traefik \
	-p 80:80 \
	-p 8080:8080 \
	-v $PWD/traefik.toml:/traefik.toml \
	-e "SERVICE_IGNORE=true" \
	containous/traefik:experimental
