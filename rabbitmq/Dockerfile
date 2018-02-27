FROM rabbitmq:3.6.6-management
ADD rabbitmq.config /etc/rabbitmq/
ADD definitions.json /etc/rabbitmq/
RUN chown rabbitmq:rabbitmq /etc/rabbitmq/rabbitmq.config /etc/rabbitmq/definitions.json
EXPOSE 5672 15672
CMD ["rabbitmq-server"]
