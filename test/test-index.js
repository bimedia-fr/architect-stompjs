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
            'client-id': 'myid'
        }
    }],
    topics: {
        stores : {
            'destination': '/topic/bimedia.stores.topic.preprod',
            'ack': 'client',
            'activemq.retroactive' : true,
            persistent: true
        }
    },
    queues: {
        stores : {
            'destination': '/queue/bimedia.stores.topic.preprod',
            'ack': 'client'
        }
    }
};

function assertFunc(name) {
    return function (topics) {
        assert.ok(topics.stores[name]);
        assert.ok(typeof topics.stores[name] == 'function');
    };
}

vows.describe("Architect Stomp Client service").addBatch({
    'A stompjs service ': {
        topic: function () {
            return stomp(config, {log : logger}, this.callback);
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
            'have a `send` method': assertFunc('send'),
            'have a `subscribe` method': assertFunc('subscribe')
        },
        'queues ': {
            topic: function (service) {
                return service.stomp.queues;
            },
            'contains a `stores` queue' : function (topics) {
                assert.ok(topics.stores);
            },
            'have a `send` method': assertFunc('send'),
            'have a `subscribe` method': assertFunc('subscribe')
        }
    }
}).exportTo(module);
