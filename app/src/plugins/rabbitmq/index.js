const broker = require('./amqp');
const Subscription = require('./subscription');

const rabbitmq = {
  init(pluginConfig) {
    return new Promise((resolve, reject) => {
      broker.init(pluginConfig, error => error != null ? reject(error) : resolve());
    });
  },

  observer({ exchange, routingKey, queue }, callback) {
    return (service) => {
      const queueName = queue.replace(/\{([^}]+)\}/, service.name);
      const subscription = new Subscription(
        broker,
        exchange,
        routingKey,
        queueName,
        {},
        null,
        false,
        {}
      );
      subscription.start();
      subscription.onMessage((message/*, h, i, metaData */) => {
        callback(message, service);
      });
    };
  },

  emitter({ exchange, routingKey }, emitterName) {
    return (service) => {
      service.assignEmitter(emitterName, (value) => {
        broker.send(exchange, routingKey, value);
      });
    };
  },
};

module.exports = rabbitmq;
