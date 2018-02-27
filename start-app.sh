docker run -d \
	-e "SERVICE_TAGS=traefik.frontend.rule=Host:localhost;PathPrefixStrip:/app" \
	-P \
	app
