/* eslint-disable no-console */
const { createService, api, rabbitmq } = require('./src');

const onMessage = (message, service) => {
  console.log('got message');
  service.setState({
    messages: [...service.getState().messages, message]
  });
};

const getEcho = async (req, res, service) => {
  let { called, messages } = service.getState();
  ++called;
  service.setState({ called });
  return api.send(res, 200, `yo ${req.params.name} - ${called}\n${JSON.stringify(messages, null, 2)}\n`);
};

const observers = [
  [
    {
      exchange: 'test-exchange',
      routingKey: 'test.message',
      queue: 'test-app',
    },
    onMessage,
  ]
];

const routes = [
    api.get('/echo/:name', getEcho),
];

createService({
  plugins: [
    [rabbitmq, {
      host: 'rabbitmq',
      username: 'user',
      vhost: '/vhost1',
      observers
    }],
    [api, {
      port: 3000,
      routes
    }]
  ],
  initialState: {
    called: 0,
    messages: []
  }
})
  .then(() => console.log('service running'))
  .catch(e => console.error(e));
