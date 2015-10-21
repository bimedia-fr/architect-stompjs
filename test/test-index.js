/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
"use strict";
var net = require('net'),
    stomp = require('..'),
    vows = require('vows'),
    assert = require('assert'),
    logger = require('./fake-logger');

var config = {
    config: [{
        'host': 'localhost',
        'port': 61613,
        'connectHeaders': {
            'host': '/',
            'heart-beat': '5000,5000',
            'client-id': 'opossum'
        }
    }],
    topics: {
        stores : {
            'destination': '/topic/bimedia.stores.topic.preprod',
            'ack': 'client',
            'activemq.retroactive' : true,
            persistent: true
        }
    }
};

vows.describe("Architect Stomp Client service").addBatch({
    'A stompjs service ': {
        topic: function () {
            return stomp(config, {log : logger}, this.callback);
        },
        'has a `channel` object ': function (service) {
            assert.ok(service.stomp.channel);
        },
        'has a `topics` object ': function (service) {
            assert.ok(service.stomp.topics);
        },
        'has a `queues` object ': function (service) {
            assert.ok(service.stomp.topics);
        },
        'topics ': {
            topic: function (service) {
                return service.stomp.topics;
            },
            'contains a `stores` topic' : function (topics) {
                assert.ok(topics.stores);
            },
            'have a `send` method': function (topics) {
                assert.ok(topics.stores.send);
                assert.ok(typeof topics.stores.send == 'function');
            },
            'have a `subscribe` method': function (topics) {
                assert.ok(topics.stores.subscribe);
                assert.ok(typeof topics.stores.subscribe == 'function');
            },
            'have a `begin` method': function (topics) {
                assert.ok(topics.stores.begin);
                assert.ok(typeof topics.stores.begin == 'function');
            },
            'have a `close` method': function (topics) {
                assert.ok(topics.stores.close);
                assert.ok(typeof topics.stores.close == 'function');
            }
        }
    }
}).exportTo(module);
