# jrpc

`jrpc` enables you to perform RPCs between different clients(e.g. browsers) via a forward server.

## Code Examples

### A request

Client B send a *request* to client A, and wait for the response from A.

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

### A notification

Client B send a *notification* to client A, without waiting for anything from A.

Client A:

    jrpc = $.JRPCClient('/jrpc', 'idA');
    jrpc.register('funcName2', function(peerId, params) {
      alert('From ' + peerId + ', ' + params.extra);
    });

Client B:

    jrpc = $.JRPCClient('/jrpc', 'idB');
    jrpc.notification('idA', 'funcName2', { extra: 'hello world' });

## Browser client API

### jrpc = $.JRPCClient(uri, peerId)

Create a jrpc client.

`uri` is the uri that a jrpc server is running on. See *jrpc-server* below.

`peerId` is id for the current client.

    jrpc = $.JRPCClient('/jrpc', 'someId');

### jrpc.register(name, fn)

Register `fn` as a function named `name`, which will be called when a request or a notification is received.

The caller's peerId, and params of a request or a notification, will be passed to `fn` as arguments.

The return value of `fn` will be used as the response when handling a request, or discard when handling a notification.

    jrpc.register('add', function(peerId, params) {
      return params.a + params.b;
    });

    jrpc.register('hello', function(peerId, params) {
      alert(params.arg);
    });

### jrpc.registerAsync(name, fn)

Register an asynchronous function.

    jrpc.registerAsync('div', function(peerId, params, reply) {
      if (!params.b)
        reply({ code: -32098, message: "b=0!" }, null);
      else
        reply(null, params.a / params.b);
    });

### jrpc.request(peerId, name, params, fn)

Send a request and waiting for a response.

`peerId`: the id of the client that handles the request

`name`: the name of the remote function

`params`: the params that will be passed to the remote function

`fn`: a callback function that will be called when a response arrives or an error occurs

    jrpc.request('someId', 'div', { a: 9, b: 3 }, function(err, result) {
      if (err)
        alert(err.message);
      else
        alert(result);
    });

### jrpc.notification(peerId, name, params)

Send a notifiction.

`peerId`: the id of the client that handles the request

`name`: the name of the remote function

`params`: the params that will be passed to the remote function

    jrpc.notification('someId', 'hello', { arg: 'hahahaha' });

### jrpc.auth(authInfo, fn)

Set `authInfo` to the jrpc client. Must be called before any other methods.

`fn` will be called when auth failed, just after:

* First time `register` or `registerAsync` is called

* Every times `request` or `notification` is called

See `jprc-server` below for more about auth.

    jrpc.auth('authInfo', function() {
      alert('auth failed!');
    });

## jrpc-server

`jrpc-server` 

    npm install jrpc-server

### Usage

    var handler = require('jrpc-server').handler;
    app.all('/jrpc', handler);

### Auth support

    var handler = require('jrpc-server').auth(function(peerId, auth) {
      return true;
      // return false;
    }).handler;
    app.all('/jrpc', handler);

## Demo Sites
