/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
"use strict";
var Stomp = require('stompjs');

//### Stompjs Module
module.exports = function setup(options, imports, register) {

    var client = options.tcp ? Stomp.overTCP(options.tcp.host || 'localhost', options.tcp.port || 61613) : Stomp.overWS(options.ws.url);

    function connect(client, cb) {
        client.connect(options.headers || {}, function () {
            cb(null, cb);
        }, function errorcb(err) {
            cb(err);
        });
    }

    var service = {
        client: client,
        onDestruct: function (callback) {
            service.client.disconnect(callback);
        }
    };

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

    connect(client, function (err) {
        if (err) {
            return register(err);
        }
        register(null, {stomp: service});
    });
};
