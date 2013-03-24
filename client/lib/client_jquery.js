var Api = require('../../server/lib/api');
var jrs = require('jsonrpc-serializer');
var qs = require('querystring');

function JRPCClient(uri, peerId, auth) {
  var d = {
    send: function(data, fn) {
      $.ajax({
        url: uri,
        type: 'POST',
        cache: false,
        data: data,
        dataType: 'json',
        error: function() {
          fn({
            code: 500,
            message: 'xxxx'
          }, null);
        },
        success: function(data, textStatus) {
          fn(null, data);
        }
      });
    }
  }
  var client = new Api(d, peerId);
  var url = uri + '?' + qs.parse({
    q: jrs.notificationObject('wait_request', {
      peerId: peerId
    })
  });
  var es = new EventSource(url);
  es.addEventListener('message', d.onEvent);

  return client;
}
