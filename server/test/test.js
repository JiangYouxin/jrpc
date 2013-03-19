var assert = require('assert')
  , jrs = require('jsonrpc-serializer')
  , Handler = require('../lib/p2p-rpc')
  , sse = require('../lib/sse');

function CheckRes (fn) {
  this.json = fn;
}

function mockPost(jstring) {
  return {
    type: "POST",
    body: JSON.parse(jstring)
  }
}

describe('sse', function() {
  var cases = [
    'oh my god',
    'oh my god\noh my baby',
    'oh my god\noh my baby\n'
  ];
  it('#send & #parse', function(done) {
    var finished = 0;
    for (var i in cases) {
      (function(c) {
        sse.send(c, function(data) {
          assert.equal(sse.parse(data), c);
          finished++;
          if (finished == cases.length)
            done();
        });
      })(cases[i]);
    }
  });
});

describe('simple-rpc-call', function() {
  var handler = new Handler().handler;
  describe('request & response', function() {
    it('should receive a reponse', function(done) {
      var req = jrs.request('test_id', 'request', {
        peerId: "id1",
        remoteId: "id2",
        authInfo: null,
        request: "Hello World"
      });
      handler(mockPost(req), new CheckRes(function(code, data) {
        assert.equal(code, 200);
        assert.equal(data.id, 'test_id');
        assert.equal(data.result.peerId, 'id2');
        assert.equal(data.result.remoteId, 'id1');
        assert.equal(data.result.response, 'Hello Sb!');
        done();
      }));
      var res = jrs.notification('response', {
        peerId: "id2",
        remoteId: "id1",
        authInfo: null,
        id: 0,
        response: "Hello Sb!"
      });
      handler(mockPost(res), new CheckRes(function(code, data) {
        assert.equal(code, 200);
        assert.equal(data.result, true);
      }));
    });
  });
});

describe('auth', function() {
  var handler = new Handler().auth(function(id, authInfo) {
    return id == authInfo;
  }).handler;
  describe('#1', function() {
    it('should be rejected', function(done) {
      var req = jrs.request('test_id', 'request', {
        peerId: "id1",
        remoteId: "id2",
        authInfo: "id001",
        request: "Hello World"
      });
      handler(mockPost(req), new CheckRes(function(code, data) {
        assert.equal(code, 401);
        done();
      }));
    });
  });
});
