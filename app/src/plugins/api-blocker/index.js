const api = require('../api');

const blocker = (service) => async (req, res) => {
  if (service.getState().called % 2 == 0) {
    return api.send(res, 400, 'nope');
  }
  return res;
}

const init = (next) => async (service, middleware) => {
  return next(service, blocker(service));
}

module.exports = init;
