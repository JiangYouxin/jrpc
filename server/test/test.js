var assert = require('assert')
  , jrs = require('jsonrpc-serializer')
  , Handler = require('../lib/p2p-rpc')
  , sse = require('../lib/sse');

function CheckRes(fn) {
  this.json = fn;
}

function CheckSseRes(fn) {
  this.send = fn;
}

function mockPost(jstring) {
  return {
    type: 'POST',
    body: JSON.parse(jstring)
  };
}

function mockGet(jstring) {
  return {
    type: 'GET',
    query: {
      q: jstring
    }
  };
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
      var resCount = 0;
      function checkDone() {
        if (resCount == 5)
          done();
      }
      // peerId: id2, recv request & send response
      var longReq = jrs.notification('wait_request', {
        peerId: 'id2'
      });

      handler(mockGet(longReq), new CheckSseRes(function(data) {
        var obj = jrs.deserialize(sse.parse(data));
        assert.equal(obj.type, 'notification');
        assert.equal(obj.payload.method, 'forward_request');
        assert.equal(obj.payload.params.peerId, 'id1');
        assert.equal(obj.payload.params.remoteId, 'id2');
        assert.equal(obj.payload.params.request, 'Hello World!');
        resCount++;

        var res = jrs.notification('response', {
          peerId: 'id2',
          remoteId: 'id1',
          id: obj.payload.params.id,
          response: 'Hello Sb!'
        });

        handler(mockPost(res), new CheckRes(function(code, data) {
          assert.equal(code, 200);
          var obj = jrs.deserializeObject(data);
          assert.equal(obj.type, 'notification');
          assert.equal(obj.payload.method, 'responseSuccess'); 
          resCount++;
          checkDone();
        }));
      }));

      // peerId: id3, recv notification
      var longReq2 = jrs.notification('wait_request', {
        peerId: 'id3'
      });

      handler(mockGet(longReq2), new CheckSseRes(function(data) {
        var obj = jrs.deserialize(sse.parse(data));
        assert.equal(obj.type, 'notification');
        assert.equal(obj.payload.method, 'forward_notification');
        assert.equal(obj.payload.params.peerId, 'id1');
        assert.equal(obj.payload.params.remoteId, 'id3');
        assert.equal(obj.payload.params.request, 'Admire You');
        resCount++;
        checkDone();
      }));

      // peerId: id1, send request & recv response
      var req = jrs.request('test_id', 'request', {
        peerId: 'id1',
        remoteId: 'id2',
        request: 'Hello World!'
      });

      handler(mockPost(req), new CheckRes(function(code, data) {
        assert.equal(code, 200);
        var obj = jrs.deserializeObject(data);
        assert.equal(obj.type, 'success');
        assert.equal(obj.payload.id, 'test_id');
        assert.equal(obj.payload.result.peerId, 'id2');
        assert.equal(obj.payload.result.remoteId, 'id1');
        assert.equal(obj.payload.result.response, 'Hello Sb!');
        resCount++;
        checkDone();
      }));

      var req2 = jrs.notification('request', {
        peerId: 'id1',
        remoteId: 'id3',
        request: 'Admire You'
      });

      handler(mockPost(req2), new CheckRes(function(code, data) {
        assert.equal(code, 200);
        var obj = jrs.deserializeObject(data);
        assert.equal(obj.type, 'notification');
        assert.equal(obj.payload.method, 'notificationSuccess');
        resCount++;
        checkDone();
      }));
    });
  });
});

describe('invalid_request', function() {
  var handler = new Handler().handler;
  var reqs = [
    // bad requests
    JSON.stringify({ admire: 'Hello World' }),
    jrs.request('test_id', 'HelloWorld', ['Oh my baby']),
    jrs.notification('HelloWorld', ['Oh my baby']),
    jrs.success('test_id', ['Oh my baby']),
    JSON.stringify(jrs.errorObject('test_id', { code: -32000, message: 'oh my baby' })),

    // bad forward requests
    jrs.request('test_id', 'request', 'HelloWorld'),
    jrs.request('test_id', 'request', {
      peerId: 'peerId',
      request: 'request'
    }),
    jrs.request('test_id', 'request', {
      remoteId: 'remoteId',
      request: 'request'
    }),
    jrs.request('test_id', 'request', {
      peerId: ['peerId'],
      remoteId: 'remoteId',
      request: 'request'
    }),
    jrs.request('test_id', 'request', {
      peerId: 'peerId',
      remoteId: ['remoteId'],
      request: 'request'
    }),

    // bad forward notifications
    jrs.notification('request', 'HelloWorld'),
    jrs.notification('request', {
      peerId: 'peerId',
      request: 'request'
    }),
    jrs.notification('request', {
      remoteId: 'remoteId',
      request: 'request'
    }),
    jrs.notification('request', {
      peerId: ['peerId'],
      remoteId: 'remoteId',
      request: 'request'
    }),
    jrs.notification('request', {
      peerId: 'peerId',
      remoteId: ['remoteId'],
      request: 'request'
    }),

    // bad responses
    jrs.request('test_id', 'response', {
      id: 12345,
      peerId: 'peerId',
      remoteId: 'remoteId',
      response: 'response'
    }),
    jrs.notification('response', 'HelloWorld'),
    jrs.notification('response', {
      id: 12345,
      peerId: 'peerId',
      response: 'response'
    }),
    jrs.notification('response', {
      id: 12345,
      remoteId: 'remoteId',
      response: 'response'
    }),
    jrs.notification('response', {
      id: 12345,
      peerId: ['peerId'],
      remoteId: 'remoteId',
      response: 'response'
    }),
    jrs.notification('response', {
      id: 12345,
      peerId: 'peerId',
      remoteId: ['remoteId'],
      response: 'response'
    }),
    jrs.notification('response', {
      peerId: 'peerId',
      remoteId: 'remoteId',
      response: 'response'
    }),
    jrs.notification('response', {
      id: '12345',
      peerId: 'peerId',
      remoteId: 'remoteId',
      response: 'response'
    }),

    // bad wait requests
    jrs.request('test_id', 'wait_request', {
      peerId: 'peerId'
    }),
    jrs.notification('wait_request', 'peerId'),
    jrs.notification('wait_request', {}),
    jrs.notification('wait_request', {
      peerId: ['peerId']
    })
  ];

  var fns = [mockGet, mockPost];
  for (var i in reqs) {
    for (var j in fns) {
      (function(fn, req) { it (req, function(done) {
        handler(fn(req), new CheckRes(function(code, data) {
          assert.notEqual(code, 200);
          done();
        }));
      });})(fns[j], reqs[i]);
    }
  }
});

describe('auth', function() {
  var handler = new Handler().auth(function(id, authInfo) {
    return id == authInfo;
  }).handler;
  var reqs = [
    jrs.request('test_id', 'request', {
      peerId: 'id1',
      remoteId: 'id2',
      authInfo: 'id001',
      request: 'Hello World'
    }),
    jrs.notification('response', {
      peerId: 'id1',
      remoteId: 'id2',
      authInfo: 'id001',
      response: 'Hello Sb'
    }),
    jrs.notification('wait_request', {
      peerId: 'id1',
      authInfo: 'id001'
    })
  ];
  var fns = [mockGet, mockPost];
  describe('#1', function() {
    for (var i in reqs) {
      var req = reqs[i];
      for (var j in fns) {
        var fn = fns[j];
        it('should be rejected', function(done) {
          handler(fn(req), new CheckRes(function(code, data) {
            assert.equal(code, 401);
            done();
          }));
        });
      };
    }
  });
});
