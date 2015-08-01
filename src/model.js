var redis = require("redis"),
    logger = require('./logger').logger,
    config = require('config'),
    utils = require('./utils');

var client = redis.createClient(config.get('redis.port', config.get('redis.ip'))),
    keyprefix = config.get('redis.prefix');


client.on("error", function(err) {
    logger.log('info', 'redis error: %s', err);
});

var add_event = function(appid, name, value) {
    appid = parseInt(appid);
    if (isNaN(appid)) return -1;

    if (typeof name != 'string' || name.length == 0 ||
        name.length > 32) return -2;
    name = name.replace('/', '');

    value = parseInt(value);
    if (isNaN(value)) return -3;

    var key = keyprefix + ':events',
        value = [appid, name, utils.fixtime(), value].join('/');

    client.lpush(key, value);
    return 0;
};

exports.add_event = add_event;
