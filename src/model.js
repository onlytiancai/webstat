var redis = require("redis");
var logger = require('./logger').logger;
var config = require('config');
var utils = require('./utils');
var mysql = require('mysql');
var async = require('async');


var redis_client = redis.createClient(
    config.get('redis.port', config.get('redis.ip')));
var keyprefix = config.get('redis.prefix');


redis_client.on("error", function(err) {
    logger.log('error', 'redis error: %s', err);
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
    
    logger.log("debug", "add_event:%s", value);
    redis_client.lpush(key, value);
    return 0;
};

// 从redis队列里取出一批数据
var fetch_events_from_redis = function(callback){
    var key = keyprefix + ':events';
    var fetch_count = config.get("event_fetch_count");
    var ret = [], empty = false;

    async.whilst(
        function(){ return fetch_count > 0 && !empty; },
        function(callback){
            fetch_count--; 
            redis_client.rpop(key, function(err, item){
                if (item) {
                    ret.push(item);
                }else {
                    empty = true; 
                }
                callback(err); 
            });
        },
        function(err){
            logger.log(
                "debug",
                "fetch_events_from_redis:len=%s empty=%s",
                ret.length, empty);
            callback(err, ret, empty); 
        }
    );
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
            logger.log("debug", "merge_events:%s", key);
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


// 从redis取数据，刷新到mysql，一直取到队列为空
var sync_to_db = function(callback){
    fetch_events_from_redis(function(err, items, empty){
        if (err) callback(err);
        items = merge_events(items);

        async.each(items, function(item, callback){
            add_event_to_db(
                item.appid,
                item.name,
                item.hits,
                item.value,
                item.created_at,
                function(err){
                    callback(err);
                    logger.log("info", "sync_to_db:", item);
                });
        },function(err){
            if (!empty) {
                sync_to_db(callback);
            }else {
                callback(err); 
            }
        });
    });
};



var run_syncdb_worker = function(){
    logger.debug("run_syncdb_worker ing");
    var worker_interval = config.get("worker_interval");
    sync_to_db(function(err){
        setTimeout(function(){
            run_syncdb_worker(); 
        }, worker_interval); 
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
exports.run_syncdb_worker = run_syncdb_worker;
