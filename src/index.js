/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
"use strict";
var stompit = require('stompit'),
    oassign = require('object-assign');


//### Stompjs Module
module.exports = function setup(options, imports, register) {

    var log = imports.log.getLogger('stomp'),
        config = options.config;
    var servers = Array.isArray(config) ? config : [];
    var recoOpts = config.reconnectOptions || {
        'maxReconnects': 10
    };

    var connections = new stompit.ConnectFailover(servers, recoOpts);

    // Log connection events
    connections.on('connecting', function (connector) {
        var address = connector.serverProperties.remoteAddress.transportPath;
        log.info('Connecting to', address);
    });

    connections.on('error', function (error) {
        var connectArgs = error.connectArgs;
        var address = connectArgs.host + ':' + connectArgs.port;
        log.warn('Connection error to', address, ':', error.message);
    });

    function destinations(channel, confs) {
        return Object.keys(confs).reduce(function (prev, curr) {
            var conf = confs[curr];
            prev[curr] = {
                send: function (headers, body, cb) {
                    if (typeof body == 'function' || !body) {
                        body = headers;
                        cb = body;
                        headers = {};
                    }
                    channel.send(oassign(conf, headers), body, cb);
                },
                subscribe : function (headers, cb) {
                    if (typeof headers == 'function') {
                        cb = headers;
                        headers = {};
                    }
                    channel.subscribe(oassign(conf, headers), cb);
                },
                begin : channel.begin.bind(channel),
                close : channel.close.bind(channel)
            };
            return prev;
        }, {});
    }

    var channelFactory = new stompit.ChannelFactory(connections);

    channelFactory.channel(function (error, channel) {
        if (error) {
            log.error('unable to create stomp channel', error.message);
            return register(error);
        }

        register(null, {
            stomp: {
                channel : channel,
                queues : destinations(channel, options.queues || {}),
                topics : destinations(channel, options.topics || {})
            },
            onDestroy: function (callback) {
                channel.close();
                return callback && callback();
            }
        });
    });
};
