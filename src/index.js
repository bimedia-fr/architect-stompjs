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

    function destinations(channelFactory, confs) {
        return Object.keys(confs).reduce(function (prev, curr) {
            var conf = confs[curr];
            prev[curr] = {
                send: function (headers, body, done) {
                    if (typeof body == 'function' || !body) {
                        body = headers;
                        done = body;
                        headers = {};
                    }
                    channelFactory.channel((err, channel) => {
                        if (err) {
                            log.error('unable to create channel', err);
                            return done(err);
                        }
                        channel.send(oassign(conf, headers), body, done);
                    });
                },
                subscribe : function (headers, messageListener) {
                    if (typeof headers == 'function') {
                        done = headers;
                        headers = {};
                    }
                    function _subscribe() {
                        log.info('subscribing to', curr);
                        channelFactory.channel((err, channel) => {
                            if (err) {
                                log.error('unable to create channel', err);
                                return;
                            }
                            channel.subscribe(oassign(conf, headers), (err, message, subscription) => {
                                if (err) {
                                    log.error('subscribe error: ', err);
                                    return setTimeout(_subscribe); // on error consider channel dead.
                                }
                                messageListener(message, channel, subscription);
                            });
                        });
                    }
                    _subscribe();
                }
            };
            return prev;
        }, {});
    }

    var channelFactory = new stompit.ChannelFactory(connections);

    register(null, {
        stomp: {
            queues : destinations(channelFactory, options.queues || {}),
            topics : destinations(channelFactory, options.topics || {})
        },
        onDestroy: function (callback) {
            channelFactory.close();
            return callback && callback();
        }
    });
};
