docker run -d \
  --network=services \
	-e "SERVICE_TAGS=traefik.frontend.passHostHeader=true,traefik.frontend.rule=Host:api.services.int;PathPrefixStrip:/app" \
	-P \
	app
