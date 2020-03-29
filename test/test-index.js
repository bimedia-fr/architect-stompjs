
var stomp = require('..'),
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

function assertFunc(dest, name) {
    assert.ok(dest.stores[name]);
    assert.ok(typeof dest.stores[name] == 'function');
};
describe('architect stompjs', function () {
    describe('A stompjs service', function () {
        it('should return a valid object', function (done) {
            stomp(config, {log : logger}, function (err, service) {
                assert.ifError(err);
                assert.ok(service.stomp.topics);
                assert.ok(service.stomp.queues);
                done();
            });
        });
    });
    describe('a topic', function(){
        it('should return a `store` object', function (done) {
            stomp(config, {log : logger}, function (err, service) {
                assert.ifError(err);
                assert.ok(service.stomp.topics.stores);
                done();
            });
        });
        it('should return a valid object with send method', function (done) {
            stomp(config, {log : logger}, function (err, service) {
                assert.ifError(err);
                assertFunc(service.stomp.topics, 'send')
                done();
            });
        });
        it('should return a valid object with subscribe method', function (done) {
            stomp(config, {log : logger}, function (err, service) {
                assert.ifError(err);
                assertFunc(service.stomp.topics, 'subscribe')
                done();
            });
        });
    });
    describe('a queue', function () {
        it('should return a `store` object', function (done) {
            stomp(config, {log : logger}, function (err, service) {
                assert.ifError(err);
                assert.ok(service.stomp.queues.stores);
                done();
            });
        });
        it('should return a valid object with send method', function (done) {
            stomp(config, {log : logger}, function (err, service) {
                assert.ifError(err);
                assertFunc(service.stomp.queues, 'send')
                done();
            });
        });
        it('should return a valid object with subscribe method', function (done) {
            stomp(config, {log : logger}, function (err, service) {
                assert.ifError(err);
                assertFunc(service.stomp.queues, 'subscribe')
                done();
            });
        });

    });
});
