const micro = require('micro');
const R = require('ramda');
const UrlPattern = require('url-pattern');
const { getParamsAndQuery, patternOpts } = require('./util');

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const _registeredRoutes = [];

const _onRequest = async (req, res) => {
  for (let routeFn of _registeredRoutes) {
    const result = await routeFn(req, res);
    if (result || res.headersSent) {
      return result;
    }
  }
  return micro.send(res, 404);
};

const _registerRoute = (service, method, path, callback) => {
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

const init = async (config, service) => {
  const server = micro(async (req, res) => await _onRequest(req, res));
  await server.listen(config.port || 3000);
  (config.routes || []).map(f => f(service));
};

const route = (method, path, callback) => (service) => {
  return _registerRoute(service, method, path, callback);
};

const _shorthandFunctions = R.zipObj(
  METHODS.map(R.toLower).map(m => m === 'delete' ? 'del' : m),
  METHODS.map(m => (path, callback) => route(m, path, callback))
);

module.exports = {
  init,
  route,
  ...micro,
  ..._shorthandFunctions,
};

