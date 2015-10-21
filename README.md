architect-stompjs
=================

Expose a [stompit](https://www.npmjs.com/package/stompit) client as an [architect](https://www.npmjs.com/package/architect) service.

### Installation

```sh
npm install --save architect-stompjs
```

### Config Format

```js
{
  "packagePath": "architect-stompjs",
  config: [{
    host: 'localhost',
    port: 61613
  }]
}
```

### Supported config elements

#### config 

Config element is an array of servers as in [stompit connection servers](http://gdaws.github.io/node-stomp/api/connect-failover/).

#### queues

Add a `queues` object to configure queues avaliable in your application.

#### topics

Add a `topics` object to configure topics avaliable in your application.

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

This module require [architect-log4js](https://github.com/bimedia-fr/architect-log4js) or equivalent as logging service.

Configure sptom service with `config.js` :

```js
module.exports = [{
    packagePath: "architect-stompjs"
}{
    packagePath: "architect-log4js"
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
    var stomp = imports.stomp; //get stomp client
    stomp.channel.send('/queue/myqueue', {}, 'application has started.');
    register();
};
```

### Using Queues Alias

Configure your alias in the architect `config.js` file :

```js
{
  "packagePath": "architect-log4js",
  config: [{
    host: 'localhost',
    port: 61613
  }],
  queues: {
    'myqueue' : {
        'destination': '/queue/my.queue.name.is.super.long'
        'ack': 'client',
    }
  }
}
```

Now you can send and recieve messages with the queue alias :

```js
module.exports = function setup(options, imports, register) {
    var client = imports.stomp; //get stomp client
    var myqueue = client.queues.myqueue;
    myqueue.send('application has started.');
    register();
};
```
