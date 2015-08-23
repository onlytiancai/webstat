var redis = require("redis");
var logger = require('./logger').logger;
var config = require('config');
var utils = require('./utils');
var mysql = require('mysql');


var redis_client = redis.createClient(
    config.get('redis.port', config.get('redis.ip')));
var keyprefix = config.get('redis.prefix');


redis_client.on("error", function(err) {
    logger.log('info', 'redis error: %s', err);
});

// 写如redis队列
var add_event = function(appid, name, value) {
    appid = parseInt(appid);
    if (isNaN(appid)) return -1;

    if (typeof name != 'string' || name.length == 0 ||
        name.length > 32) return -2;
    name = name.replace('/', '');

    value = parseInt(value);
    if (isNaN(value)) return -3;

    var key = keyprefix + ':events';
    var value = [appid, name, utils.fixtime(), value].join('/');

    redis_client.lpush(key, value);
    return 0;
};

// 从redis队列里取出一批数据
var fetch_events_from_redis = function(callback){
    var key = keyprefix + ':events';
    var fetch_count = config.get("event_fetch_count");
    var ret = [];

    var pop_callback = function(err, item){
       if (item) ret.push(item);

        // 取够一批或队列为空
        if (--fetch_count <= 0 || item == null) {
            logger.log("info", "fetch_events_from_redis:%s %s", fetch_count, ret.length);
            callback(null, ret); 
        }else {
            redis_client.rpop(key, pop_callback);
        }
    };

    redis_client.rpop(key, pop_callback);
};


// 根据 appid, name, created_at合并事件
var merge_events = function(items){
    var map = {};
    var ret = [];
    items.forEach(function(item){
        var arr = item.split('/');
        var appid = arr[0],
            name = arr[1],
            created_at = arr[2],
            value = parseInt(arr[3]);
        var key = [appid, name, created_at].join('/');

        if (!map.hasOwnProperty(key)) {
            logger.log("info", "merge_events:%s", key);
            map[key] = {appid: appid, name: name, created_at: created_at,
                hits: 1, value: value};
            ret.push(map[key]);
        }else {
            map[key].hits += 1;
            map[key].value += value;
        }
    });

    return ret;
};

var sync_to_db = function(callback){
    fetch_events_from_redis(function(err, items){
        items = merge_events(items);
        items.forEach(function(item){
            add_event_to_db(item.appid, item.name, item.hits, item.value,
                item.created_at, function(err){
                    callback(err);
                    logger.log("info", "sync_to_db:%o", item);
                });
        });

    });
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

// 写入mysql数据库
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
exports.merge_events = merge_events;
exports.sync_to_db = sync_to_db;
