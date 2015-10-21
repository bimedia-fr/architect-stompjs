/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
"use strict";

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

var LEVELS = ['log', 'info', 'debug', 'warn', 'trace', 'error'];

var logger = LEVELS.reduce(function (prev, curr) {
    prev[curr] = console[curr] || console.log;
    prev['is' + capitalizeFirst(curr) + 'Enabled'] = function () {
        return true;
    };
    return prev;
}, {});

var nooplogger = LEVELS.reduce(function (prev, curr) {
    prev[curr] = function () {
    };
    prev['is' + capitalizeFirst(curr) + 'Enabled'] = function () {
        return true;
    };
    return prev;
}, {});

var api = {
    getLogger : function () {
        return nooplogger;
    },
    getNoopLogger : function () {
        return nooplogger;
    },
    requestLogger : function () {
        return api;
    }
};
module.exports = api;
