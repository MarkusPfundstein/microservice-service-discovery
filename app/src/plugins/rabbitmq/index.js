const broker = require('./amqp');
const Subscription = require('./subscription');

const _makeObserver = (service, { exchange, routingKey, queue }, callback) => {
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

const _makeEmitter = (service, { exchange, routingKey }, emitterName) => {
  service.assignEmitter(emitterName, (value) => {
    broker.send(exchange, routingKey, value);
  });
};

const init = async (pluginConfig, service) => {
  if (pluginConfig.debug === true) {
    broker.on('error', console.error);
    broker.on('info', console.log);
  }

  await broker.init(pluginConfig);
  const observers = pluginConfig.observers || [];
  const emitters = pluginConfig.emitters || [];
  for (let [conf, emitFn] of observers) {
    _makeObserver(service, conf, emitFn);
  }
  for (let [conf, emitterName] of emitters) {
    _makeEmitter(service, conf, emitterName);
  }
};

module.exports = {
  init,
};
