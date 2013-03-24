var Api = require('../../server/lib/api');
var jrs = require('jsonrpc-serializer');
var qs = require('querystring');

jQuery.JRPCClient = function(uri, peerId, auth) {
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
  var client = new Api(peerId, d);
  var url = uri + '?' + qs.stringify({
    q: jrs.notification('wait_request', {
      peerId: peerId
    })
  });
  var es = new EventSource(url);
  es.addEventListener('message', d.onEvent);

  return client;
}
