var jrs = require('jsonrpc-serializer');

module.exports = function(d, peerId) {

  // d.send is function(req, fn)
  //   req is JSON object
  //   fn is function(err, result)
  var _handlers = {};
  var _eventListener = {};
  var _auth = null;
  var _onAuthFailed = null;
  var _hasFunction = false;

  function checkAuthFailed(err) {
    if (err.code == 401) {
      if (_onAuthFailed)
        _onAuthFailed();
      return true;
    } else {
      return false;
    }
  }

  this.setAuth = function(auth, fn) {
    _auth = auth;
    _onAuthFailed = fn;
  };

  this.addEventListener = function(e, fn) {
    _eventListener[e] = fn;
  };

  this.register = function(method, fn) {
    this.registerAsync(method, function(peerId, params, reply) {
      reply(null, fn(peerId, params));
    });
  };
  this.registerAsync = function(method, fn) {
    _handlers[method] = fn;
    if (!_hasFunction) {
      _hasFunction = true;
      d.connectLong(function(data) {
        var obj = jrs.deserialize(data);
        if (obj.type == 'error') {
          checkAuthFailed(obj.payload.error);
          return;
        } 
        var inner = jrs.deserializeObject(obj.payload.params.request);
        var reply = function(err, result) {};
        if (obj.payload.method == 'forward_request') {
          if (inner.type != 'request')
            return;
          reply = function(err, result) {
            var innerReply = err
              ? jrs.errorObject(inner.payload.id, err)
              : jrs.successObject(inner.payload.id, result);
            var response = jrs.notificationObject('response', {
              peerId: peerId,
              remoteId: obj.payload.params.peerId,
              id: obj.payload.params.id,
              response: innerReply
            });
            d.send(response);
          };
        } else if (obj.payload.method == 'forward_notification') {
          if (inner.type != 'notification')
            return;
        } else {
          return;
        }
        var fn = _handlers[inner.payload.method];
        if (!fn) {
          reply({
            code: -32601,
            message: 'method not found.'
          }, null);
          return;
        }
        fn(obj.payload.params.peerId, inner.payload.params, reply);
      });
    }
  };
  this.unregister = function(method) {
    delete _handlers[method];
  };

  var _id = 0;
  this.request = function(remoteId, method, params, fn) {
    var inner = jrs.requestObject(++_id, method, params);
    var p = {
      peerId: peerId,
      remoteId: remoteId,
      request: inner
    };
    if (_auth)
      params.auth = _auth;
    var req = jrs.requestObject(_id, 'request', p);

    d.send(req, function(err, result) {
      if (!err) {
        var obj = jrs.deserializeObject(result);
        if (obj.type == 'success') {
          var inner = jrs.deserializeObject(obj.payload.result.response);
          if (inner.type == 'success') {
            // success
            fn(null, inner.payload.result);
          } else {
            // remote report error
            fn(inner.payload.error, null);
          }
        } else {
          // server report error
          fn(obj.payload.error, null);
        }
      } else if (!checkAuthFailed(err)) {
        // network error
        fn(err, null);
      }
    });
  };

  this.notification = function(remoteId, method, params) {
    var inner = jrs.notificationObject(method, params);
    var p = {
      peerId: peerId,
      remoteId: remoteId,
      request: inner
    };
    if (_auth)
      p.auth = _auth;
    var req = jrs.notificationObject('request', p);
    d.send(req, function(err, result) {
      if (err)
        checkAuthFailed(err)
    });
  };
};
