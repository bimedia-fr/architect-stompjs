var stompit = require('stompit');


// ### Stompjs Module
module.exports = function setup(options, imports, register) {

    let log = imports.log.getLogger('stomp'),
        config = options.config;
    let servers = Array.isArray(config) ? config : [];
    let recoOpts = config.reconnectOptions || {
        maxReconnects: 10
    };
    let clients = [];
    let manager = new stompit.ConnectFailover(servers, recoOpts);

    function _removeclient(client) {
        const index = clients.indexOf(client);
        if (index > -1) {
            clients.splice(index, 1);
        }
        return client;
    }

    // Log connection events
    manager.on('connecting', function (server) {
        var address = server.serverProperties.remoteAddress.transportPath;
        log.debug('Connecting to', address);
    });

    // Log connection events
    manager.on('connect', function (server) {
        var address = server.serverProperties.remoteAddress.transportPath;
        log.debug('Connected to', address);
    });

    manager.on('error', function (error) {
        var connectArgs = error.connectArgs;
        var address = connectArgs.host + ':' + connectArgs.port;
        log.warn('Connection error to', address, ':', error.message);
    });

    function destinations(channelFactory, confs) {
        return Object.keys(confs).reduce(function (prev, curr) {
            var conf = confs[curr];
            prev[curr] = {
                send: function (headers, body, done) {
                    if (typeof body == 'function') {
                        done = body;
                        body = headers;
                        headers = {};
                    }
                    manager.connect((err, client /* , reconnect*/) => {
                        if (err) {
                            log.error('unable to create client ' + err.message, err);
                            return done(err);
                        }
                        client.on('error', (error) => {
                            log.error('stomp client error ' + error.message);
                        });
                        client.send(Object.assign(conf, headers), body, (err, res) => {
                            client.disconnect();
                            done(err, res);
                        });
                    });
                },
                subscribe : function (headers, messageListener) {
                    if (typeof headers == 'function') {
                        messageListener = headers;// must be the listener
                        headers = {};
                    }
                    function _subscribe() {
                        log.info('subscribing to', curr);
                        manager.connect((err, client, reconnect) => {
                            if (err) {
                                log.error('unable to create client ' + err.message, err);
                                return ;
                            }
                            clients.push(client);
                            client.on('error', (error) => {
                                log.error('stomp client error ' + error.message);
                                reconnect();
                            });
                            client.subscribe(Object.assign(conf, headers), (err, message, subscription) => {
                                if (err) {
                                    log.error('subscribe error: ', err);
                                    _removeclient(client).disconnect();
                                    return setTimeout(_subscribe); // on error consider channel dead.
                                }
                                messageListener(message, client, subscription);
                            });
                        });
                    }
                    _subscribe();
                }
            };
            return prev;
        }, {});
    }

    register(null, {
        stomp: {
            queues : destinations(manager, options.queues || {}),
            topics : destinations(manager, options.topics || {})
        },
        onDestroy: function (done) {
            clients.forEach((client) => {
                client.disconnect();
            });
            return done && done();
        }
    });
};
