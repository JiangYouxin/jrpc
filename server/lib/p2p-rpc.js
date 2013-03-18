exports.version = "0.0.1";

exports.Handler = function() {
  var self = this;

  var _auth = function(peerId, authInfo) {
    return true;
  }

  this.auth = function(fn) {
    _auth = fn;
    return self;
  }

  var _requests = {};

  var _currentId = 0;
  
  var _nextId = function() {
    return _currentId++;
  }
  
  this.handler = function(req, res, next) {
    if (req.type == "GET") {
      // TODO: handle Server Sent Events
    } else if (req.type == "POST") {
      var data = req.body;
      if (!_auth(data.params.peerId, data.params.authInfo)) {
        onError(401, {
          code: -32000,
          message: "auth failed"
        });
        return;
      }
      if (data.method == "request") {
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
              onResult({
                peerId: remoteId,
                remoteId: peerId,
                response: rawData
              });
            }
          };
        } else {
          onResult(true);
        }
      } else if (data.method == "response") {
        var h = _requests[data.params.id];
        if (h && h.remoteId == data.params.peerId && h.peerId == data.params.remoteId) {
          h.fn(data.params.response);
          onResult(true);
        } else {
          onError(500, {
            code: -32001,
            message: "Request not exists."
          });
        }
      } else {
        onError(500, {
          code: -32601,
          message: "Method not found."
        });
      }
      return;

      function onResult(result) {
        res.json(200, {
          jsonrpc: '2.0',
          result: result,
          id: data.id
        });
      }

      function onError(statusCode, err) {
        res.json(statusCode, {
          jsonrpc: '2.0',
          error: err,
          id: data.id
        });
      }
    }
  }
}
