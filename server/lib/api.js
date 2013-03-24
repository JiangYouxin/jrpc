var jrs = require('jsonrpc-serializer');

module.exports = function(peerId, d) {

  // d.send is function(req, fn)
  //   req is JSON object
  //   fn is function(err, result)
  var _handlers = {};

  this.register = function(method, fn) {
    this.registerAsync(method, function(peerId, params, reply) {
      reply(null, fn(peerId, params));
    });
  };
  this.registerAsync = function(method, fn) {
    _handlers[method] = fn;
  };
  this.unregister = function(method) {
    delete _handlers[method];
  };

  var _id = 0;
  this.request = function(remoteId, method, params, fn) {
    var inner = jrs.requestObject(++_id, method, params);
    var req = jrs.requestObject(_id, 'request', {
      peerId: peerId,
      remoteId: remoteId,
      request: inner
    });
    d.send(req, function(err, result) {
      if (err)
        fn(err, null);
      else {
        var obj = jrs.deserializeObject(result);
        if (obj.type == 'success')
          fn(null, obj.payload.result.response.result);
        else
          fn(obj.payload.error, null);
      }
    });
  };

  this.notification = function(remoteId, method, params) {
    var inner = jrs.notificationObject(method, params);
    var req = jrs.notificationObject('request', {
      peerId: peerId,
      remoteId: remoteId,
      request: inner
    });
    d.send(req);
  };

  // it is responsibility of `d` to keep a `sse long-connection` and callback to `d.onEvent`
  d.onEvent = function(data) {
    var obj = jrs.deserialize(data);
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
      // TODO: method not found
      return;
    }
    fn(obj.payload.params.peerId, inner.payload.params, reply);
  };
}
