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
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          fn({
            code: 500,
            message: 'server: ' + textStatus
          }, null);
        },
        success: function(data, textStatus) {
          fn(null, data);
        }
      });
    },
    connectLong: function(fn) {
      var p = { peerId: peerId };
      if (auth)
        p.auth = auth;
      var url = uri + '?' + qs.stringify({
        q: jrs.notification('wait_request', p)
      });
      var es = new EventSource(url);
      es.onmessage = function(e) {
        fn(e.data);
      };
    }
  }
  var client = new Api(d, peerId, auth);

  return client;
}
