var sse = require('./sse')
  , jrs = require('jsonrpc-serializer');

module.exports = function() {
  function _auth(peerId, authInfo) {
    return true;
  }

  var _self = this;
  this.auth = function(fn) {
    _auth = fn;
    return _self;
  }

  var _requests = {};
  var _longConns = {};

  var _currentId = 0;
  
  function _nextId() {
    return _currentId++;
  }
 
  function _handleRequest(type, data, req, res) {
    // the json-rpc id used by server & response-side client
    var alId = _nextId();
    // the peerId of request-side client;
    var peerId = data.params.peerId;
    // the peerId of response-side client;
    var remoteId = data.params.remoteId;

    if (typeof(peerId) != 'string' || typeof(remoteId) != 'string') {
      res.json(403, 'peerId or remoteId is not present or not a string');
      return;
    }

    var fn = _longConns[remoteId];
    if (!fn) {
      if (type == 'request') {
        res.json(200, jrs.errorObject(data.id, {
          code: -32001,
          message: "Remote not online."
        }));
      } else {
        res.json(200, jrs.notificationObject('notificationFailed'));
      }
      return;
    }

    // reply to peerId
    if (type == 'request') {
      _requests[alId] = {
        peerId: peerId,
        remoteId: remoteId,
        fn: function(response) {
          res.json(200, jrs.successObject(data.id, {
            peerId: remoteId,
            remoteId: peerId,
            response: response
          }));
        }
      };
      req.on('close', function() {
        delete _requests[alId];
      });
    } else {
      res.json(200, jrs.notificationObject('notificationSuccess'));
    }

    // forward request || notification to remoteId
    fn(jrs.notification('forward_' + type, {
        peerId: peerId,
        remoteId: remoteId,
        id: alId,
        request: data.params.request
    }));
  } 

  function _handleResponse(params, res) {
    var id = params.id;
    var remoteId = params.remoteId;
    var peerId = params.peerId;

    if (typeof(id) != 'number' && typeof(id) != 'string') {
      res.json(403, 'id is not present or not a number/string: ' + JSON.stringify(params));
      return;
    }
    if (typeof(peerId) != 'string' || typeof(remoteId) != 'string') {
      res.json(403, 'peerId or remoteId is not present or not a string');
      return;
    }

    process.nextTick(function() {
      var h = _requests[params.id];

      if (h && h.remoteId == params.peerId && h.peerId == params.remoteId) {
        delete _requests[params.id];
        // forward response to remoteId
        h.fn(params.response);
        res.json(200, jrs.notificationObject('responseSuccess'));
      } else {
        res.json(200, jrs.notificationObject('responseFailed'));
      }
    }); 
  }

  this.handler = function(req, res, next) {
    var rpcReq;

    if (req.query && req.query.q) {
      rpcReq = jrs.deserialize(req.query.q);
    } else {
      rpcReq = jrs.deserializeObject(req.body);
    }

    if (rpcReq.type == 'request' || rpcReq.type == 'notification') {
      var params = rpcReq.payload.params;

      if (rpcReq.payload.method == 'wait_request') {
        if (rpcReq.type != 'notification') {
          res.json(403, 'type is not notification');
          return;
        }
        if (typeof(params.peerId) != 'string') {
          res.json(403, 'peerId is not present or not a string');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        });
        if (!_auth(params.peerId, params.authInfo)) {
          var data = jrs.errorObject('0', {
            code: 401,
            message: "auth failed"
          });
          var rawData = sse.stringify(JSON.stringify(data));
          res.write(rawData);
        } else {
          _longConns[params.peerId] = function(data) {
            var rawData = sse.stringify(data);
            res.write(rawData);
          };
          req.on('close', function() {
            delete _longConns[params.peerId];
          });
        }
      } else if (!_auth(params.peerId, params.authInfo)) {
        res.json(401, 'auth failed');
        return;
      } else if (rpcReq.payload.method == 'request') {
        _handleRequest(rpcReq.type, rpcReq.payload, req, res);
      } else if (rpcReq.payload.method == 'response') {
        if (rpcReq.type != 'notification') {
          res.json(403, 'type is not notification');
          return;
        }
        _handleResponse(params, res);
      } else {
        res.json(404, 'Not found');
      }
    } else {
      res.json(404, 'Not found');
    }
  };
}
