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
 
  function _handleLongConn(peerId, res) {
    // TODO: timeout & close
    // TODO: HTTP 200
    _longConns[peerId] = function(data) {
      sse.send(data, res.send);
    };
  }

  function _handleRequest(type, data, res) {
    // the json-rpc id used by server & response-side client
    var alId = _nextId();
    // the peerId of request-side client;
    var peerId = data.params.peerId;
    // the peerId of response-side client;
    var remoteId = data.params.remoteId;

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
    // TODO: timeout
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
    // TODO remoteId & response must be present
    var h = _requests[params.id];

    if (h && h.remoteId == params.peerId && h.peerId == params.remoteId) {
      // forward response to remoteId
      h.fn(params.response);
      res.json(200, jrs.notificationObject('responseSuccess'));
    } else {
      res.json(200, jrs.notificationObject('responseFailed'));
    } 
  }

  this.handler = function(req, res, next) {
    var rpcReq;

    if (req.type == 'GET') {
      rpcReq = jrs.deserialize(req.query.q);
    } else if (req.type == 'POST') {
      rpcReq = jrs.deserializeObject(req.body);
    } else {
      next();
      return;
    }

    if (rpcReq.type == 'request' || rpcReq.type == 'notification') {
      // TODO: peerId & authInfo must be present
      var params = rpcReq.payload.params;
      if (!_auth(params.peerId, params.authInfo)) {
        res.json(401, 'auth failed');
        return;
      }

      if (rpcReq.payload.method == 'request') {
        _handleRequest(rpcReq.type, rpcReq.payload, res);
      } else if (rpcReq.payload.method == 'response') {
        // TODO: type must be notification
        _handleResponse(params, res);
      } else if (rpcReq.payload.method == 'wait_request') {
        // TODO: type must be notification
        // TODO: peerId must be present
        _handleLongConn(params.peerId, res);
      } else {
        // TODO: return json-rpc error
        res.json(404, 'method not found');
      }
    } else {
      // TODO: return json-rpc error
      res.json(404, 'method not found');
    }
  };
}
