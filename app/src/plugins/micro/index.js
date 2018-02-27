const micro = require('micro');
const R = require('ramda');
const UrlPattern = require('url-pattern');
const { getParamsAndQuery, patternOpts } = require('./util');

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const _registeredRoutes = [];

const onRequest = async (req, res) => {
  for (let routeFn of _registeredRoutes) {
    const result = await routeFn(req, res);
    if (result || res.headersSent) {
      return result;
    }
  }
  return false;
};

const registerRoute = (service, method, path, callback) => {
  if (!R.find(x => x.toUpperCase(), METHODS)) {
    throw new Error(`${method} not supported`);
  }

  const parsedRoute = new UrlPattern(path, patternOpts);
  const routeFn = (req, res) => {

    const { params, query } = getParamsAndQuery(parsedRoute, req.url);

    if (params && req.method === method) {
      return callback(Object.assign(req, { params, query}), res, service);
    }
  };

  _registeredRoutes.push(routeFn);
};

module.exports = {
  init(config) {
    return new Promise((resolve, reject) => {
      const server = micro(async (req, res) => await onRequest(req, res));
      server.listen(config.port || 3000, error => error != null ? reject(error) : resolve(server));
    });
  },
  route(method, path, callback) {
    return (service) => registerRoute(service, method, path, callback);
  },
  send: micro.send,
  buffer: micro.buffer,
  json: micro.json
};

