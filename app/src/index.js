const MicroService = require('./lib/micro-service');

const createService = (config) => {
  return (new MicroService()).init(config);
};

module.exports = {
  MicroService,
  createService,
  rabbitmq: require('./plugins/rabbitmq'),
  api: require('./plugins/micro')
};
