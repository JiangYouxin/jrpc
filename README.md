developing...

`jrpc` is a library that enables you to perform a RPC from one client(e.g. browser) to another via a forward server.

Code Examples
===

Send a Request
---

    jrpc = $.JRPCClient('/jrpc', 'idA');
    jrpc.register('funcName1', function(peerId, params) {
      return 'Hello ' + peerId + ', ' + params.extra;
    });

    jrpc = $.JRPCClient('/jrpc', 'idB');
    jrpc.request('idA', 'funcName1', { extra: 'how are you?' }, function(err, result) {
      alert(result); // will output "Hello idB, how are you?" if idA is online.
    });

Send a Notification
---

    jrpc = $.JRPCClient('/jrpc', 'idA');
    jrpc.register('funcName2', function(peerId, params) {
      alert('From ' + peerId + ', ' + params.extra);
    });

    jrpc = $.JRPCClient('/jrpc', 'idB');
    jrpc.notification('idA', 'funcName2', { extra: 'hello world' });

JRPC forward server
===

Browser client API
===

Java client API
===

Demo Sites
===
