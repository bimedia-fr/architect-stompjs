const stompit = require('stompit');
const dns = require('dns');

// ### Stompjs Module
module.exports = function setup(options, imports, register) {

    let log = imports.log.getLogger('stomp');
    let clients = [];

    function createManager(options) {
        return new Promise((resolve, reject) => {
            if (options.config) {
                let servers = Array.isArray(options.config) ? options.config : [];
                let recoOpts = options.config.reconnectOptions || { maxReconnects: 10 };
                return resolve(new stompit.ConnectFailover(servers, recoOpts));
            }
            if (!options.srv) {
                return reject(new Error('either config or srv is needed'));
            }
            dns.resolveSrv('_stomp._tcp.' + options.srv.name, (err, results) => {
                let servers = results.map((res) => Object.assign({host: res.name, port: res.port}, options.srv.opts));
                let recoOpts = options.config.reconnectOptions || { maxReconnects: 10 };
                return resolve(new stompit.ConnectFailover(servers, recoOpts));
            });
        });
    }

    function _removeclient(client) {
        const index = clients.indexOf(client);
        if (index > -1) {
            clients.splice(index, 1);
        }
        return client;
    }

    function destinations(manager, confs) {
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
                            log.debug('stomp client error ' + error.message);
                        });
                        client.sendString(Object.assign(conf, headers), body, {}, (err, res) => {
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
                        manager.connect((err, client) => {
                            if (err) {
                                log.error('unable to create client ' + err.message, err);
                                return ;
                            }
                            function reconnect() {
                                _removeclient(client).disconnect();
                                return setTimeout(_subscribe);
                            }
                            client.on('error', (error) => {
                                log.debug('stomp client error ' + error.message);
                                reconnect();
                            });
                            client.subscribe(Object.assign(conf, headers), (err, message, subscription) => {
                                if (err) {
                                    log.error('subscribe error: ', err);
                                    return reconnect(); // on error consider channel dead.
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

    createManager(options).then((manager) => {
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
    }).catch(register);
};
