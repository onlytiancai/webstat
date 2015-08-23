var redis = require("redis");
var logger = require('./logger').logger;
var config = require('config');
var utils = require('./utils');
var mysql = require('mysql');


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


var mysql_pool = mysql.createPool(config.get('mysql_conn_args'));

var execute_sql = function(sql, args, callback){
    mysql_pool.getConnection(function (err, conn) {
        if (err){
            callback(err);
            logger.log('error', 'mysql error: %s', err);
            return;
        }

        conn.query(sql, args, function(err, res){
            conn.release(); 
            callback(err);
        });
    });
};

var add_event_to_db = function(appid, name, hits, value, created_at,
    callback) {

    var sql = "insert into event_stats(appid, name, total, count, created_at)"
        + " values(?, ?, ?, ?, ?)"
        + " on duplicate key update total=total+?, count=count+?;"
    var args = [appid, name, hits, value, created_at, hits, value];

    execute_sql(sql, args, callback);

};

exports.add_event_to_db = add_event_to_db;
exports.add_event = add_event;
