/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
"use strict";
var net = require('net'),
    stomp = require('..'),
    vows = require('vows'),
    assert = require('assert');

var config = {
    tcp: {
        host: 'localhost',
        port: 61613
    },
    queues: {
        desactivations: '/queue/bimedia.host.desactivations.queue.preprod'
    }
};

vows.describe("Architect Stomp Client service").addBatch({
    'A stompjs service ': {
        topic: function () {
            return stomp(config, {}, this.callback);
        },
        'has a `client` object ': function (stompservice) {
            stompservice.ok(stompservice.client);
        }
    }
}).exportTo(module);
