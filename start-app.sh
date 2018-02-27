docker run -d \
  --network=services \
	-e "SERVICE_TAGS=traefik.frontend.passHostHeader=true,traefik.frontend.rule=PathPrefixStrip:/app" \
	-P \
	app
