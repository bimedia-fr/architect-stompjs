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

    var log = imports.log.getLogger('stompjs');

    var service = {
        client: getClient(options),
        onDestruct: function (callback) {
            log.info('closing Stomp service');
            service.client.disconnect(callback);
        },
        connectCounter : 1,
        respawnDelay : function () {
            return Math.pow(service.connectCounter++, 2) * 100;
        },
        respawnScheduled : false,
        registered : false,
        connected : false
    };

    function connect(client, cb) {
        client.connect(options.headers || {}, function () {
            cb(null, cb);
        }, function errorcb(err) {
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

    var reconnect = function () {
        log.info('trying to reconnect...');
        service.respawnScheduled = false;
        if (service.connected) {
            return;
        }
        service.client = getClient(options);
        connect(service.client, function (err) {
            if (err) {
                log.error('connection error retrying ' + err);
                if (!service.connected && service.connectCounter < 20 && !service.respawnScheduled) {
                    setTimeout(reconnect, service.respawnDelay());
                    service.respawnScheduled = true;
                }
                return;
            }
            service.connectCounter = 1;
            service.connected = true;
            log.info('connected');
        });
    };

    connect(service.client, function (err) {
        if (err) {
            service.connected = false;
            if (!service.registered) {
                // stop registration process
                return register(err);
            }
            log.error('connection error ' + err);
            // connection lost : try to reconnect
            if (!service.respawnScheduled) {
                setTimeout(reconnect, service.respawnDelay());
                service.respawnScheduled = true;
            }
            return;
        }
        service.registered = true;
        service.connected = true;
        register(null, {stomp: service});
        log.info('Stomp service registered');
    });
};
