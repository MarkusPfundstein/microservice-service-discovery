FROM rabbitmq

# Define environment variables.
ENV RABBITMQ_USER user
ENV RABBITMQ_PASSWORD user

ADD init.sh /init.sh
EXPOSE 5672 15672 4369 9100 9101 9102 9103 9104 9105

# Define default command
CMD ["/init.sh"]
