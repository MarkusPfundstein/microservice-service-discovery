/* eslint-disable no-console */
const { createService, micro } = require('./src');

const getEcho = async (req, res, service) => {
  let { called } = service.getState();
  ++called;
  service.setState({ called });
  return micro.send(res, 200, `yo ${req.params.name} - ${called}`);
};

createService({
  name: 'core-trigg-crud',
  plugins: [
    [micro, {
      port: 3000,
    }]
  ],
  api: [
    micro.route('GET', '/echo/:name', getEcho)
  ],
  state: {
    called: 0,
  },
  observers: [

  ],
  emitters: [

  ],
})
  .then(() => console.log('service running'))
  .catch(e => console.error(e));
