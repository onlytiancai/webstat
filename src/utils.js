var moment = require('moment');
var config = require('config');
var mysql = require('mysql');
var mysql_pool = mysql.createPool(config.get('mysql_conn_args'));

/*
 * 格式化时间为统一粒度，默认为5分钟粒度，如11:23 -> 11:20, 11:27 - > 11:25
 * */

exports.fixtime = function(input, fix) {
    fix = fix || 5;

    var time = input ? moment(input) : moment(),
        minutes = time.minutes();
    minutes = minutes - (minutes % fix);
    time = time.seconds(0).millisecond(0).minutes(minutes);
    return time.format('YYYY-MM-DD HH:mm:ss');
};

/* 执行SQL语句
 * */

exports.execute_sql = function(sql, args, callback){
    mysql_pool.query(sql, args, function(err, rows, fields){
        callback(err, rows, fields);
    });
};
