docker run -it \
	--network=services \
	-e "SERVICE_TAGS=traefik.frontend.passHostHeader=true,traefik.frontend.rule=PathPrefixStrip:/test/app" \
	-v $PWD:/app \
	-P \
	testapp \
	nodemon index.js
