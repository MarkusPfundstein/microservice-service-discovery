const logger = (service) => async (req, res) => {
  console.log(req.url, new Date(), service.getState().called);
  return res;
}

const init = (next) => async (service, middleware) => {
  return next(service, middleware(logger(service)));
}

module.exports = init;
