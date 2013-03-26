developing...

# jrpc

`jrpc` is a library that enables you to perform a RPC from one client(e.g. browser) to another via a forward server.

## Code Examples

### Send a Request

Client A:

    jrpc = $.JRPCClient('/jrpc', 'idA');
    jrpc.register('funcName1', function(peerId, params) {
      return 'Hello ' + peerId + ', ' + params.extra;
    });

Client B:

    jrpc = $.JRPCClient('/jrpc', 'idB');
    jrpc.request('idA', 'funcName1', { extra: 'how are you?' }, function(err, result) {
      alert(result); // will output "Hello idB, how are you?" if idA is online.
    });

### Send a Notification

Client A:

    jrpc = $.JRPCClient('/jrpc', 'idA');
    jrpc.register('funcName2', function(peerId, params) {
      alert('From ' + peerId + ', ' + params.extra);
    });

Client B:

    jrpc = $.JRPCClient('/jrpc', 'idB');
    jrpc.notification('idA', 'funcName2', { extra: 'hello world' });

## Browser client API

### jrpc = $.JRPCClient(uri, peerId, [auth])

    jrpc = $.JRPCClient('/jrpc', 'someId');
    jrpc = $.JRPCClient('/jrpc', 'myId', 'a1b2c3d4');

### jrpc.register(name, fn)

    jrpc.register('add', function(peerId, params) {
      return params.a + params.b;
    });

    jrpc.register('hello', function(peerId, params) {
      alert(params.arg);
    });

### jrpc.registerAsync(name, fn)

    jrpc.registerAsync('div', function(peerId, params, reply) {
      if (!params.b)
        reply({ code: -32098, message: "b=0!" }, null);
      else
        reply(null, params.a / params.b);
    });

### jrpc.request(peerId, name, params, fn)

    jrpc.request('someId', 'div', { a: 9, b: 3 }, function(err, result) {
      if (err)
        alert(err.message);
      else
        alert(result);
    });

### jrpc.notification(peerId, name, params)

    jrpc.notification('someId', 'hello', { arg: 'hahahaha' });

## jrpc-server

    npm install jrpc-server

    var handler = require('jrpc-server').handler;
    app.all('/jrpc', handler);

    var handler = require('jrpc-server').auth(function(peerId, auth) {
      return true;
      // return false;
    }).handler;
    app.all('/jrpc', handler);

## Demo Sites
