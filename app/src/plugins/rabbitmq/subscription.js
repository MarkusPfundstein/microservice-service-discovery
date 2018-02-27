var events = require('events');

const log = {
  e: console.error,
  d: console.log,
};

function Subscription(broker, exchange, routingKey, queueName, userConf, eventPublisher, neverDisable = false, extraOptions = {}) {
  this._broker = broker;
  this._exchange = exchange;
  this._routingKey = routingKey;
  this._name = queueName;
  this._userConf = userConf;
  this._brokerSubscription = null;
  this._neverDisable = neverDisable;
  this._options = extraOptions;
}

Subscription.prototype.start = function() {
  var that = this;
  // forward incoming message from broker to our own event handler
  this._brokerSubscription = this._broker.subscribe(
    this._exchange,
    this._routingKey,
    this._name,
    this._userConf,
    this._neverDisable);
  this._emitter = new events.EventEmitter();
  // Allows a channel to subscribe to more than default of 11 actions.
  // Configurable as it is normally a safeguard against memory leaks.
  if (this._options.maxEventEmitterListeners) {
    this._emitter.setMaxListeners(this._options.maxEventEmitterListeners);
  }
  this._brokerSubscription.event.on('message', function (m, h, i, p) {
    that._emitter.emit('message', m, h, i, p);
  });

};

Subscription.prototype.stop = function() {
  this._broker.unsubscribe(this._exchange, this._routingKey, this._name);
  this._brokerSubscription = null;
};

Subscription.prototype.delete = function() {
  this._broker.destroy(this._exchange, this._routingKey, this._name);
  this._brokerSubscription = null;
};

Subscription.prototype.onError = function(callback) {
  // subscribe on our local emitter to callback
  this._emitter.on('error', callback);
};

Subscription.prototype._handleErrorInCallback = function(e) {
  try {
    if (!this._emitter.emit('error', e.stack)) {
      // no one listening to registered error
      log.e(e.stack);
    }
  } catch (emitError) {
    // error not yet registered event
    log.e(e.stack);
  }
};

Subscription.prototype.onMessage = function(callback) {
  var that = this;
  this._emitter.on('message', function (m, h, i, p) {
    try {
      callback(m, h, i, p);
    } catch (e) {
      that._handleErrorInCallback(e);
    }
  });
};

module.exports = Subscription;
