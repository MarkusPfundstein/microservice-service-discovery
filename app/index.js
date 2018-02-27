/* eslint-disable no-console */
const { createService, micro, rabbitmq } = require('./src');

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
  return micro.send(res, 200, `yo ${req.params.name} - ${called}\n${JSON.stringify(messages, null, 2)}\n`);
};

createService({
  name: 'app',
  plugins: [
    [rabbitmq, {
      host: 'rabbitmq',
      username: 'user',
      vhost: '/vhost1'
    }],
    [micro, {
      port: 3000,
    }]
  ],
  api: [
    micro.route('GET', '/echo/:name', getEcho)
  ],
  state: {
    called: 0,
    messages: [],
  },
  observers: [
    rabbitmq.observer(
      {
        exchange: 'test-exchange',
        routingKey: 'test.message',
        queue: '{name}',
      },
      onMessage,
    ),
  ],
  emitters: [

  ],
})
  .then(() => console.log('service running'))
  .catch(e => console.error(e));
