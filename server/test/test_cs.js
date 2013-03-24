var Api = require('../lib/api');
var jrs = require('jsonrpc-serializer');
var Handler = require('../lib/p2p-rpc');
var sse = require('../lib/sse');
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

function mockGet(jstring) {
  var obj = {
    type: 'GET',
    query: {
      q: jstring
    }
  };
  addCloseEvent(obj);
  return obj;
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
  var self = this;
  var sseReq = jrs.notification('wait_request', {
    peerId: peerId
  });
  handler(mockGet(sseReq), {
    send: function(rawData) {
      var data = sse.parse(rawData);
      self.onEvent(data);
    }
  });

  this.send = function(data, fn) {
    var req = mockPost(JSON.stringify(data));
    handler(req, {
      json: function(code, j) {
        if (fn) {
          if (code != 200)
            fn(code, null);
          else
            fn(null, j);
        }
      }
    });
  };
}

describe('request', function() {
  var handler = new Handler().handler;
  var d1 = new Delegate('id1', handler);
  var client1 = new Api('id1', d1);
  var d2 = new Delegate('id2', handler);
  var client2 = new Api('id2', d2);

  it('call', function(done) {
    client2.register('call', function(peerId, params) {
      return 'Hello ' + peerId + ':' + params.name;
    });
    client1.request('id2', 'call', { name: 'World' }, function(err, result) {
      assert.equal(result, 'Hello id1:World');
      done();
    });
  });
});

describe('notification', function() {
  var handler = new Handler().handler;
  var d1 = new Delegate('id1', handler);
  var client1 = new Api('id1', d1);
  var d2 = new Delegate('id2', handler);
  var client2 = new Api('id2', d2);

  it('call', function(done) {
    client2.register('call', function(peerId, params) {
      assert.equal(peerId, 'id1');
      assert.equal(params.name, 'World');
      done();
    });
    client1.notification('id2', 'call', { name: 'World' });
  });
});
