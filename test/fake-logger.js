
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

let LEVELS = ['log', 'info', 'debug', 'warn', 'trace', 'error'];

let nooplogger = LEVELS.reduce(function (prev, curr) {
    prev[curr] = function () {
    };
    prev['is' + capitalizeFirst(curr) + 'Enabled'] = function () {
        return true;
    };
    return prev;
}, {});

let api = {
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
