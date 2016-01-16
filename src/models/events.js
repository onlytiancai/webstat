/*!
 * Copyright(c) 2015-2016 onlytiancai <onlytiancai@gmail.com>
 * MIT Licensed
 */

var utils = require('../utils');
var logger = require('../logger').logger;

/*
* 跟踪一个事件
*/

function track(options, properties, callback) {
    if (! (options.app_id && options.user_id && options.event_name)) {
        throw Error("app_id, user_id, event_name all required."); 
    }

    options.event_value = options.event_value || 0;
    options.event_time = options.event_time || new Date();
    properties = properties || {};
    properties = JSON.stringify(properties);

    var sql = "insert into events(app_id, user_id, event_name, event_value, event_time, properties)" + 
        " values(?, ?, ?, ?, ?, ?)";
    var args = [options.app_id, options.user_id, options.event_name,
        options.event_value, options.event_time, properties];

    utils.execute_sql(sql, args, function(err){
        if (err) {
            logger.log('error', 'events.track err: %s', err);
        }
        callback(err);
    });
}

/*
* 根据条件查询一个事件的历史
*/

function query(options, where, callback) {
    if (! (options.app_id && options.user_id && options.event_name)) {
        throw Error("app_id, user_id, event_name all required."); 
    }
    options.from_date = options.from_date || new Date(); // TODO:
    options.to_date = options.to_date || new Date();
    options.type = options.type || 'count';
    options.metrics = options.metrics || 'value';
    where = where || '';

    var sql = 'select * from events where app_id = ? and user_id = ? and ' +
        'event_name = ? and event_time >= ? and event_time >= ?';
    var args = [options.app_id, options.user_id, options.event_name,
        options.from_date, options.to_date];
    utils.execute_sql(sql, args, function(err, rows, fields){
        if (err) return callback(err);
        callback(null, rows);
    });
}

/*
* 获取某个appid的所有事件列表
*/

function getEvents(appid) {

}

/*
* 获取某个事件的属性列表
*/

function getEventProperties(appid, event_name) {

}

/*
* 获取某属性的值列表
*/

function getPropertyValues(appid, event_name, peoperty_name) {

}

exports.track = track;
exports.query = query;
