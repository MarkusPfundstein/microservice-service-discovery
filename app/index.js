/* eslint-disable no-console */
const { createService, api, rabbitmq } = require('./src');

const onMessage = (service) => (message) => {
  console.log('got message');
  service.setState({
    messages: [...service.getState().messages, message]
  });
};

const getEcho = (service) => async (req, res) => {
  let { called, messages } = service.getState();
  ++called;
  service.setState({ called });
  service.gotEchoCall({ from: req.params.name, called });
  return api.send(res, 200, `yo ${req.params.name} - ${called}\n${JSON.stringify(messages, null, 2)}\n`);
};

const subscriptions = [
  {
    exchange: 'test-exchange',
    routingKey: 'test.message',
    queue: 'test-app',
    handler: onMessage,
  },
];

const emitters = [
  {
    exchange: 'test-exchange',
    routingKey: 'test.message',
    emitter: 'gotEchoCall'
  }
];

const routes = [
    api.get('/echo/:name', getEcho)
];

createService({
  plugins: [
    rabbitmq({
      host: 'rabbitmq',
      username: 'user',
      vhost: '/vhost1',
      subscriptions,
      emitters,
      onInfo: console.log,
      onError: console.error
    }),
    api({
      port: 3000,
      routes
    })
  ],
  initialState: {
    called: 0,
    messages: []
  }
}).then(() => console.log('service running'), console.error);
