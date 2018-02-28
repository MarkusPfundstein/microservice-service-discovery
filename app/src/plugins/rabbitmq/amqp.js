/* eslint-disable no-console */
const EventEmitter = require('events');
const amqp = require('amqp');
const extend = require('extend');

// array of queueConfs
const queueConfs = [];

// array of queues that we have available
let queues = [];

// maps exchange name -> exchange instance
const exchanges = {};

// if we are connected this is true
let connected = false;

// the amqp connection
let connection = null;

// Disabled state
let disabled = false;

// we use this one to communicate with the outside world
// -> so that we don't have to log from within
const brokerEmitter = new EventEmitter();

const log = {
  e: console.error,
};

function emitError(str) {
  try {
    brokerEmitter.emit('error', str);
  } catch (e) {
    void e;
  }
}

function emitInfo(str) {
  brokerEmitter.emit('info', str);
}

function enableBroker() {
  disabled = false;
  queues.forEach((q) => {
    if (q.conf.subscribe && !q.conf.neverDisable){
      try {
        q.queue.subscribe(q.conf.subscribeOpts, function (message, headers, deliveryInfo, messageObject) {
          q.conf.event.emit('message', message, headers, deliveryInfo, messageObject);
        }).addCallback(function (ok) {
          q.consumerTag = ok.consumerTag;
        });
      } catch (e) {
        log.e('EXITING BECAUSE theres an Error resubscribing to queue ' + q.queueConf.name + ': ', e);
        process.exit();
      }
    }
  });

}

function disableBroker() {
  disabled = true;
  queues.forEach((q) => {
    if (q.conf.subscribe && q.consumerTag && !q.conf.neverDisable){
      try {
        q.queue.unsubscribe(q.consumerTag);
      } catch (e) {
        log.e('Error unsubscribing from queue: ', e);
      }
    }
  });
}

function isEnabled() {
  return !disabled;
}

const init = function(config, callback) {
  if (connection === null) {
    emitInfo('initialize with config: ' + JSON.stringify(config));
    connection = amqp.createConnection({
      host: config.host || 'broker.triggi.int'
      , port: config.port || 5672
      , login: config.username
      , password: config.password || config.username
      , connectionTimeout: config.timeout || 10000
      , authMechanism: 'AMQPLAIN'
      , vhost: config.vhost || '/'
      , heartbeat: 1
      , noDelay: true
      , ssl: config.ssl || {enabled: false}
    });

    // initialize connection object
    connection.on('ready', function () {
      emitInfo('connection on');

      const length = queueConfs.length;
      for (let i = 0; i < length; i++) {
        _setupQueue(queueConfs[i]);
      }

      // only call callback if we have one
      // AND
      // if its the first time we connect
      if (callback && !connected) {
        callback(null, connection);
      }
      connected = true;
    });

    connection.on('error', function (err) {
      emitError(err);
    });

  }

  return this;
};

const _getExchange = function (name, callback) {
  if (exchanges[name] === undefined) {
    try {
      connection.exchange(name, {durable: true, autoDelete: false, passive: false}, function (ex) {
        exchanges[name] = ex;
        callback(null, ex);
      });
    } catch (e) {
      callback(e, null);
    }
  } else {
    callback(null, exchanges[name]);
  }
};

const _setupQueue = function (queueConf) {
  // Set up a queue only once, even if we reconnect.
  // Otherwise it will create multiple consumers for named queues, and multiple queues for unnamed queues
  if (queueConf.isSetup) {
    return;
  }
  emitInfo('setting up the queues: ' + JSON.stringify(queueConf));
  connection.queue(queueConf.name, queueConf.options, function (q) {
    if (queueConf.routingKey !== undefined) {
      _getExchange(queueConf.exchange, function (err, exchange) {
        if (err) {
          throw err;
        }
        if (Array.isArray(queueConf.routingKey)) {
          queueConf.routingKey.forEach(function(routingKey) {
            q.bind(exchange, routingKey);
          });
        } else {
          q.bind(exchange, queueConf.routingKey);
        }
      });
    }
    if (queueConf.subscribe && !disabled) {
      emitInfo('subscribe to queue: ' + queueConf.name + ' with rk: ' + queueConf.routingKey);
      q.subscribe(queueConf.subscribeOpts, function (message, headers, deliveryInfo, messageObject) {
        queueConf.event.emit('message', message, headers, deliveryInfo, messageObject);
      }).addCallback(function (ok) {
        queues.push({conf: queueConf, queue: q, consumerTag: ok.consumerTag});
      });
    } else {
      queues.push({conf: queueConf, queue: q, consumerTag: null});
    }
    queueConf.isSetup = true;
  });
};

function createQueueConf(exchange, routingKey, name, userConf, neverDisable) {
  const config = {
    autoDelete : false,
    passive: false,
    durable: true
  };

  if (typeof name === 'undefined' || name === '') {
    config.autoDelete = true;
    config.durable = false;
  }

  if (typeof userConf !== undefined && typeof userConf === 'object') {
    extend(true, config, userConf);
  }

  const subscribeOpts = {
    ack: userConf && userConf.acknowledge ? true : undefined,
    prefetchCount: userConf && userConf.prefetchCount ? userConf.prefetchCount : undefined,
  };
  if(subscribeOpts.ack) {
    emitInfo('Creating queue ' + name + ' which requires manual acknowleding. Prefetch count limited to ' + subscribeOpts.prefetchCount);
  }

  const queueConf = {
    routingKey: routingKey,
    exchange: exchange,
    event: new EventEmitter,
    subscribeOpts: subscribeOpts,
    // create queue if it doesn't exist (passive: false)
    options: config,
    subscribe: true,
    name: name != null ? name : '',
    neverDisable: neverDisable
  };

  return queueConf;
}

// No name implies anonymous listener, used for sending fanout messages to parallel queueConfs.
const subscribe = function (exchange, routingKey, name, userConf, neverDisable = false) {
  if (_alreadySubscribed(exchange, name)){
    throw new Error('Already subbed to queue '+ name +' on exchange '+ exchange + '. Can\'t sub to the same queue multiple times');
  }
  const queueConf = createQueueConf(exchange, routingKey, name, userConf, neverDisable);
  queueConfs.push(queueConf);
  if (connected === true) {
    _setupQueue(queueConf);
  }
  return queueConf;
};

const _findQueue = function (exchange, routingKey, name) {
  const findFunction = function(q) {
    return q.conf.exchange === exchange &&
      q.conf.name === name &&
      q.conf.routingKey === routingKey;
  };

  return queues.find(findFunction) || null;

};

const _alreadySubscribed = function (exchange, name){
  const findFunction = function(q) {
    return q.exchange === exchange && q.name === name;
  };

  return !queueConfs.find(findFunction) ? false : true;
};

const unsubscribe = function (exchange, routingKey, name) {

  const queue = _findQueue(exchange, routingKey, name);
  if (!queue) {
    emitError('can\'t unsubscribe from queue: not found');
    return;
  }
  emitInfo('unsubscribe from queue: ' + name + ' with rk: ' + routingKey);
  queue.queue.unsubscribe(queue.consumerTag);
  _removeQueue(queue);
};
/*
 * TODO: Technically seen we don't need to be consuming from a queue to delete it.
 */
const destroy = function (exchange, routingKey, name) {
  emitInfo('destroy queue: ' + name + ' with rk: ' + routingKey);
  const queue = _findQueue(exchange, routingKey, name);
  if (!queue) {
    emitError('can\'t delete from queue: not found');
    return;
  } else {
    queue.queue.destroy();
    _removeQueue(queue);
  }
};

const _removeQueue = function(queue){
  // delete dude from queues array
  const newQueues = [];
  queues.forEach(function (q) {
    if (q != queue) {
      newQueues.push(q);
    }
  });
  queues = newQueues;

  queue.conf.event.removeAllListeners();
  delete queue.conf.event;
  /* eslint-disable-next-line no-delete-var */
  delete queue;
};

const send = function (exchange, routingKey, message) {
  _getExchange(exchange, function(err, ex){
    if (err){
      emitError('Can\'t retrieve exchange! Retrying later.');
      setTimeout(send, 500, exchange, routingKey, message);
    }
    emitInfo('Publishing message: ' + JSON.stringify(message) + ' with rk: ' + routingKey);
    ex.publish(routingKey, message);
  });
};

module.exports.init = init;
module.exports.unsubscribe = unsubscribe;
module.exports.destroy = destroy;
module.exports.subscribe = subscribe;
module.exports.send = send;
module.exports.enable = enableBroker;
module.exports.disable = disableBroker;
module.exports.isEnabled = isEnabled;
module.exports.emitter = brokerEmitter;
