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

  var _currentId = 0;
  
  function _nextId() {
    return _currentId++;
  }
 
  function _sendResult(res, id, result) {
    res.json(200, {
      jsonrpc: '2.0',
      result: result,
      id: id
    });
  }

  function _sendError(res, code, id, error) {
    res.json(code, {
      jsonrpc: '2.0',
      error: error,
      id: id
    });
  }

  function _handleRequest(data, res) {
    // the json-rpc id used by server & request-side client
    var id = data.id;
    // the json-rpc id used by server & response-side client
    var alId = _nextId();
    // the peerId of request-side client;
    var peerId = data.params.peerId;
    // the peerId of response-side client;
    var remoteId = data.params.remoteId;
    // TODO: notify the remote client
    if (id) {
      _requests[alId] = {
        peerId: peerId,
        remoteId: remoteId,
        fn: function(rawData) {
          _sendResult(res, data.id, {
            peerId: remoteId,
            remoteId: peerId,
            response: rawData
          });
        }
      };
    } else {
      _sendResult(res, null, true);
    }
  } 

  function _handleResponse(data, res) {
    var h = _requests[data.params.id];
    if (h && h.remoteId == data.params.peerId && h.peerId == data.params.remoteId) {
      h.fn(data.params.response);
      _sendResult(res, null, true);
    } else {
      _sendErr(res, 500, null, {
        code: -32001,
        message: "Request not exists."
      });
    } 
  }

  this.handler = function(req, res, next) {
    if (req.type == "GET") {
      // TODO: handle Server Sent Events
    } else if (req.type == "POST") {
      var data = req.body;
      if (!_auth(data.params.peerId, data.params.authInfo)) {
        _sendError(res, 401, data.id, {
          code: -32000,
          message: "auth failed"
        });
      } else if (data.method == "request") {
        _handleRequest(data, res);
      } else if (data.method == "response") {
        _handleResponse(data, res);
      } else {
        _sendError(res, 500, data.id, {
          code: -32601,
          message: "Method not found."
        });
      }
      return;
    } else {
      next();
    }
  }
}
