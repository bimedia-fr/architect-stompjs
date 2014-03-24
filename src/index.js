/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
"use strict";
var Stomp = require('stompjs');

module.exports = function setup(options, imports, register) {

    var client = options.tcp ? Stomp.overTCP(options.tcp.host || 'localhost', options.tcp.port || 61613) : Stomp.overWS(options.ws.url);

    function connect(client, cb) {
        client.connect(options.headers || {}, function () {
            cb(null, cb);
        }, function errorcb(err) {
            cb(err);
        });
    }

    function getQueues(client, config) {
        var res = {};
        Object.keys(config || {}).forEach(function (key) {
            res[key] = {
                send : function (headers, message) {
                    client.send(config[key], headers, message);
                },
                subscribe : function (callback, headers) {
                    client.subscribe(config[key], callback, headers);
                }
            };
        });
        return res;
    }

    var service = {
        client: client,
        queues : getQueues(client, options.queues),
        onDestruct: function (callback) {
            client.disconnect(callback);
        }
    };

    connect(client, function (err) {
        if (err) {
            return register(err);
        }
        register(null, {stomp: service});
    });
};
