/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
"use strict";
var Stomp = require('stompjs');

function getClient(options) {
    var client = options.tcp ? Stomp.overTCP(options.tcp.host || 'localhost', options.tcp.port || 61613) : Stomp.overWS(options.ws.url);
    var heartbeat = options.heartbeat || {};
    client.heartbeat.outgoing = heartbeat.outgoing || 2000;
    client.heartbeat.incoming = heartbeat.incoming || 2000;
    return client;
}

//### Stompjs Module
module.exports = function setup(options, imports, register) {

    var log = imports.log.getLogger('stompjs'), iv;

    function cleanUp() {
        if (iv) {
            clearInterval(iv);
        }
        iv = null;
    }

    var service = {
        client: getClient(options),
        onDestruct: function (callback) {
            log.info('closing Stomp service');
            service.client.disconnect(callback);
            cleanUp();
        },
        registered : false,
        connected : false
    };

    function connect(cb) {
        service.client.connect(options.headers || {}, function () {
            service.connected = true;
            cb(null, cb);
        }, function errorcb(err) {
            service.connected = false;
            cb(err);
        });
    }

    function buildQueues(config) {
        var res = {};
        Object.keys(config || {}).forEach(function (key) {
            res[key] = {
                send : function (headers, message) {
                    service.client.send(config[key], headers, message);
                },
                subscribe : function (callback, headers) {
                    service.client.subscribe(config[key], callback, headers);
                }
            };
        });
        return res;
    }

    service.queues = buildQueues(options.queues);

    var errorHandler = function errorHandler(err, handler) {
        log.error('connection error retrying ' + err);
        if (!iv) {
            // connection lost : try to reconnect
            iv = setInterval(handler, 10 * 1000);
        }
    };

    var reconnect = function () {
        log.info('trying to reconnect...');
        service.client = getClient(options);
        connect(function (err) {
            if (err) {
                return errorHandler(err, reconnect);
            }
            cleanUp();
            log.info('connected');
        });
    };

    connect(function (err) {
        if (err) {
            if (!service.registered) {
                // stop registration process
                return register(err);
            }
            return errorHandler(err, reconnect);
        }
        service.registered = true;
        register(null, {stomp: service});
        log.info('Stomp service registered');
    });
};
