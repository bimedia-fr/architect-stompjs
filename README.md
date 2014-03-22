architect-stompjs
=================

Expose a [stompjs](https://github.com/jmesnil/stomp-websocket) client as an architect service.

### Installation

```sh
npm install --save architect-stompjs
```
### Config Format
```js
{
  "packagePath": "architect-log4js",
  tcp: {
    host: 'localhost',
    port: 61613
  }
}
```

### Supported config elements

#### tcp
Add a `tcp` object to configure a tcp connection to the stomp server.

* `host` : is stomp server hostname, default is *localhost*
* `port` : is stomp server port, default is *61613*

#### ws
Add a `ws` object to configure a websocket to the stomp server.

* `url` : is websocket server url.

#### headers
Add a `headers` object to configure connection properties see [stompjs connection](http://jmesnil.net/stomp-websocket/doc/#connection).

#### queues
Add a queues object to configure queues alias avaliable in your application.


### Usage

Boot [Architect](https://github.com/c9/architect) :

```js
var path = require('path');
var architect = require("architect");

var configPath = path.join(__dirname, "config.js");
var config = architect.loadConfig(configPath);

architect.createApp(config, function (err, app) {
    if (err) {
        throw err;
    }
    console.log('application started');
});
```

Configure sptomjs service with `config.js` :

```js
module.exports = [{
    packagePath: "architect-stompjs"
}, './routes'];
```

Consume *stomp* service in your application :

```js
{
  "name": "routes",
  "version": "0.0.1",
  "main": "index.js",
  "private": true,

  "plugin": {
    "consumes": ["stomp"]
  }
}
```

Eventually use the `stomp` service in your app :

```js
module.exports = function setup(options, imports, register) {
    var client = imports.stomp; //get default logger
    client.send('/queue/myqueue', {}, 'application has started.');
    register();
};
```

### Using Queues Alias

Configure your alias in the architect `config.js` file :
```js
{
  "packagePath": "architect-log4js",
  tcp: {
    host: 'localhost',
    port: 61613
  },
  queues: {
    'myqueue' : '/queue/my.queue.name.is.super.long'
  }
}
```

Now you can send and recieve messages with the queue alias :
```js
module.exports = function setup(options, imports, register) {
    var client = imports.stomp; //get default logger
    var myqueue = client.queues.myqueue;
    myqueue.send({}, 'application has started.');
    register();
};
```
