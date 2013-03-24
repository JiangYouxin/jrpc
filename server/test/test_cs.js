var Api = require('../lib/api');
var jrs = require('jsonrpc-serializer');
var Handler = require('../lib/p2p-rpc');
var assert = require('assert');

function addCloseEvent(obj) {
  obj.on = function(e, fn) {
    if (e == 'close')
       this.fn = fn;
  };
  obj.disConn = function() {
    if (this.fn)
       this.fn();
  };
}

function mockPost(jstring) {
  var obj = {
    type: 'POST',
    body: JSON.parse(jstring)
  };
  addCloseEvent(obj);
  return obj;
}

function Delegate(peerId, handler) {
  this.peerId = peerId;
  this.send = function(data, fn) {
    var req = mockPost(data);
    handler(req, {
      json: function(code, j) {
        if (code != 200)
          fn(code, null);
        else
          fn(null, j);
      }
    }); 
  }
}
