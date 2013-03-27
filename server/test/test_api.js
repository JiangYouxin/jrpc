var Api = require('../lib/api');
var jrs = require('jsonrpc-serializer');
var assert = require('assert');

describe('API test', function() {
  it('notification', function(done) {
    var d = {
      send: function(data, fn) {
        var obj = jrs.deserializeObject(data);
        assert.equal(obj.type, 'notification');
        assert.equal(obj.payload.method, 'request');
        assert.equal(obj.payload.params.peerId, 'id1');
        assert.equal(obj.payload.params.remoteId, 'id2');
        var inner = jrs.deserializeObject(obj.payload.params.request);
        assert.equal(inner.type, 'notification');
        assert.equal(inner.payload.method, 'call');
        assert.equal(inner.payload.params.param, 'param');
        done();
      }
    };
    var api = new Api(d, 'id1');
    api.notification('id2', 'call', { param: 'param'});
  });

  it('request', function(done) {
    var d = {
      send: function(data, fn) {
        var obj = jrs.deserializeObject(data);
        assert.equal(obj.type, 'request');
        assert.equal(obj.payload.method, 'request');
        assert.equal(obj.payload.params.peerId, 'id1');
        assert.equal(obj.payload.params.remoteId, 'id2');
        var inner = jrs.deserializeObject(obj.payload.params.request);
        assert.equal(inner.type, 'request');
        assert.equal(inner.payload.method, 'call');
        assert.equal(inner.payload.params.param, 'param');

        var innerReply = jrs.successObject(inner.payload.id, 'haha');
        var reply = jrs.successObject(obj.payload.id, {
          peerId: 'id2',
          remoteId: 'id1',
          response: innerReply
        });
        fn(null, reply);
      }
    };
    var api = new Api(d, 'id1');
    api.request('id2', 'call', { param: 'param'}, function(err, result) {
      assert.equal(result, 'haha');
      done();
    });
  });

  it('onEvent-notification', function(done) {
    var d = {
      send: function(data, fn) {
      },
      connectLong: function(fn) {
        var inner = jrs.notificationObject('call', {
          h: 'baby'
        });
        var data = jrs.notification('forward_notification', {
          peerId: 'id2',
          remoteId: 'id1',
          request: inner
        });
        fn(data);
      }
    };
    var api = new Api(d, 'id1');
    api.register('call', function(remoteId, params) {
      assert.equal(remoteId, 'id2');
      assert.equal(params.h, 'baby');
      done();
    });
  });

  it('onEvent-request', function(done) {
    var d = {
      send: function(data, fn) {
        var obj = jrs.deserializeObject(data);
        assert.equal(obj.type, 'notification');
        assert.equal(obj.payload.method, 'response');
        assert.equal(obj.payload.params.peerId, 'id1');
        assert.equal(obj.payload.params.remoteId, 'id2');
        assert.equal(obj.payload.params.id, 3333);
        var inner = jrs.deserializeObject(obj.payload.params.response);
        assert.equal(inner.type, 'success');
        assert.equal(inner.payload.id, 1);
        assert.equal(inner.payload.result, 'goods');
        done();
      },
      connectLong: function(fn) {
        var inner = jrs.requestObject(1, 'call', {
          h: 'baby'
        });
        var data = jrs.notification('forward_request', {
          peerId: 'id2',
          remoteId: 'id1',
          id: 3333,
          request: inner
        });
        fn(data);
      }
    };
    var api = new Api(d, 'id1');
    api.register('call', function(remoteId, params) {
      assert.equal(remoteId, 'id2');
      assert.equal(params.h, 'baby');
      return 'goods';
    });
  });

  it('onEvent-request: method not found', function(done) {
    var d = {
      send: function(data, fn) {
        var obj = jrs.deserializeObject(data);
        assert.equal(obj.type, 'notification');
        assert.equal(obj.payload.method, 'response');
        assert.equal(obj.payload.params.peerId, 'id1');
        assert.equal(obj.payload.params.remoteId, 'id2');
        assert.equal(obj.payload.params.id, 3333);
        var inner = jrs.deserializeObject(obj.payload.params.response);
        assert.equal(inner.type, 'error');
        assert.equal(inner.payload.id, 1);
        assert.equal(inner.payload.error.code, -32601);
        done();
      },
      connectLong: function(fn) {
        var inner = jrs.requestObject(1, 'call2', {
          h: 'baby'
        });
        var data = jrs.notification('forward_request', {
          peerId: 'id2',
          remoteId: 'id1',
          id: 3333,
          request: inner
        });
        fn(data);
      }
    };
    var api = new Api(d, 'id1');
    api.register('call', function(remoteId, params) {
      assert.equal(remoteId, 'id2');
      assert.equal(params.h, 'baby');
      return 'goods';
    });
  });
});
