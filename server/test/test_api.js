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
});
