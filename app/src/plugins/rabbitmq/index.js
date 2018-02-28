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
    callback(service)(message);
  });
};

const _makeEmitter = (service, { exchange, routingKey }, emitterName) => {
  console.log('assign', emitterName);
  service.assignEmitter(emitterName, (value) => {
    broker.send(exchange, routingKey, value);
  });
};

const init = (pluginConfig) => async (service) => {
  if (typeof pluginConfig.onError === 'function') {
    broker.emitter.on('error', pluginConfig.onError);
  }
  if (typeof pluginConfig.onInfo === 'function') {
    broker.emitter.on('info', pluginConfig.onInfo);
  }

  await broker.init(pluginConfig);
  const subscriptions = pluginConfig.subscriptions || [];
  const emitters = pluginConfig.emitters || [];
  for (let conf of subscriptions) {
    _makeObserver(service, conf, conf.handler);
  }
  for (let conf of emitters) {
    _makeEmitter(service, conf, conf.emitter);
  }
};

module.exports = init;
