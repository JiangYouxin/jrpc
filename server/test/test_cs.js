var Api = require('../lib/api');
var jrs = require('jsonrpc-serializer');
var Handler = require('../lib/jrpc');
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

  this.connectLong = function(fn) {
    handler(mockGet(sseReq), {
      writeHead: function(header) {
      },
      write: function(rawData) {
        var data = sse.parse(rawData);
        fn(data);
      }
    });
  };

  this.send = function(data, fn) {
    var req = mockPost(JSON.stringify(data));
    handler(req, {
      json: function(code, j) {
        if (fn) {
          if (code != 200)
            fn({
              code: code,
              message: j
            }, null);
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
  var client1 = new Api(d1, 'id1');
  var d2 = new Delegate('id2', handler);
  var client2 = new Api(d2, 'id2');

  client2.register('call', function(peerId, params) {
    return 'Hello ' + peerId + ':' + params.name;
  });
  client2.registerAsync('callerr', function(peerId, params, reply) {
    reply({
      code: -32099,
      message: 'Hello Error!'
    }, null);
  });

  it('call', function(done) {
    client1.request('id2', 'call', { name: 'World' }, function(err, result) {
      assert.equal(err, null);
      assert.equal(result, 'Hello id1:World');
      done();
    });
  });

  it('remote not found', function(done) {
    client1.request('id3', 'call', { name: 'World' }, function(err, result) {
      assert.equal(err.code, -32001);
      assert.equal(result, null);
      done();
    });
  });

  it('method not found', function(done) {
    client1.request('id2', 'call2', { name: 'World' }, function(err, result) {
      assert.equal(err.code, -32601);
      assert.equal(result, null);
      done();
    });
  });

  it('remote error', function(done) {
    client1.request('id2', 'callerr', { name: 'World' }, function(err, result) {
      assert.equal(err.code, -32099);
      assert.equal(result, null);
      done();
    });
  });
});

describe('notification', function() {
  var handler = new Handler().handler;
  var d1 = new Delegate('id1', handler);
  var client1 = new Api(d1, 'id1');
  var d2 = new Delegate('id2', handler);
  var client2 = new Api(d2, 'id2');

  it('call', function(done) {
    client2.register('call', function(peerId, params) {
      assert.equal(peerId, 'id1');
      assert.equal(params.name, 'World');
      done();
    });
    client1.notification('id2', 'call', { name: 'World' });
  });
});

describe('auth', function() {
  var handler = new Handler().auth(function(peerId, auth) {
    return peerId == auth;
  }).handler;
  var d = new Delegate('id1', handler);
  var client = new Api(d, 'id1');

  it('auth failed', function(done) {
    var count = 3;
    client.setAuth('id11', function() {
      count--;
      if (count == 0)
        done();
    });
    client.request('id2', 'call', { name: 'World' }, function(err, result) {
    });
    client.notification('id2', 'call', { name: 'World' });
    client.register('callme', function(peerId, params) {
      return 0;
    });
  });
});
