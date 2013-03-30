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

## Browser-side API

The browser-side library acts as a plugin of `jQuery`.

You can go through the `client` directory of the repo, and run `npm install` to generate the library named `jrpc-client.js`.  Then put some code like this in your .HTML file:

    <script type="text/javascript" src="/javascripts/jquery-1.9.1.min.js"></script>
    <script type="text/javascript" src="/javascripts/jrpc-client.js">

### jrpc = $.JRPCClient(uri, peerId)

Create a jrpc client.

`uri` is the uri that a jrpc server is running on. See *jrpc-server* below.  
`peerId` is id for the current client.

    jrpc = $.JRPCClient('/jrpc', 'someId');

### jrpc.register(name, fn)

Register `fn` as a *handler function* named `name`, which will be called when a request or a notification is received.  
The caller's peerId, and params of a request or a notification, will be passed to `fn` as arguments.  
The return value of `fn` will be used as the response when handling a request, or discard when handling a notification.

    jrpc.register('add', function(peerId, params) {
      return params.a + params.b;
    });

    jrpc.register('hello', function(peerId, params) {
      alert(params.arg);
    });

### jrpc.registerAsync(name, fn)

Register an asynchronous handler function.

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

`jrpc-server` is a forward server running on `node.js`.

It enables browser clients to communicate with each other.

You can install `jrpc-server` with `npm`:

    npm install jrpc-server

### Used with express

    var JRPC = require('jrpc-server');
    var handler = new JRPC().handler;

    // here app is the application object of express
    app.all('/jrpc', handler);

### Auth support (Optional)

You can register to jrpc server a auth callback, which will be called while one client wants to send a request/notifiction to another, or register a handler function. All the operations by a client will be prevented if the callback returns false.

    var JRPC = require('jrpc-server');
    var handler = new JRPC().auth(function(peerId, authInfo) {
      return true;
      // return false;
    }).handler;
    app.all('/jrpc', handler);

## Demo Sites

You can go through the *demo_site* directory of the repo.

## LICENSE

(The MIT License)

Copyright (c) 2013 JiangYouxin <jiangyouxin9@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
