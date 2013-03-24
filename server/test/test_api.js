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
    var api = new Api('id1', d);
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
    var api = new Api('id1', d);
    api.request('id2', 'call', { param: 'param'}, function(err, result) {
      assert.equal(result, 'haha');
      done();
    });
  });

  it('onEvent-notification', function(done) {
    var d = {
      send: function(data, fn) {
      }
    };
    var api = new Api('id1', d);
    api.register('call', function(remoteId, params) {
      assert.equal(remoteId, 'id2');
      assert.equal(params.h, 'baby');
      done();
      return 'goods';
    });

    var inner = jrs.notificationObject('call', {
      h: 'baby'
    });
    var data = jrs.notification('forward_notification', {
      peerId: 'id2',
      remoteId: 'id1',
      request: inner
    });
    d.onEvent(data);
  });

  it('onEvent-request', function(done) {
    var d = {
      send: function(data, fn) {
        var obj = jrs.deserializeObject(data);
        assert.equal(obj.type, 'notification');
        assert.equal(obj.payload.method, 'response');
        assert.equal(obj.payload.params.peerId, 'id1');
        assert.equal(obj.payload.params.remoteId, 'id2');
        assert.equal(obj.payload.params.id, 1);
        var inner = jrs.deserializeObject(obj.payload.params.response);
        assert.equal(inner.type, 'success');
        assert.equal(inner.payload.result, 'goods');
        done();
      }
    };
    var api = new Api('id1', d);
    api.register('call', function(remoteId, params) {
      assert.equal(remoteId, 'id2');
      assert.equal(params.h, 'baby');
      return 'goods';
    });

    var inner = jrs.requestObject(1, 'call', {
      h: 'baby'
    });
    var data = jrs.notification('forward_request', {
      peerId: 'id2',
      remoteId: 'id1',
      id: 1,
      request: inner
    });
    d.onEvent(data);
  });
});
