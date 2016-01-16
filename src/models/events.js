/*!
 * Copyright(c) 2015-2016 onlytiancai <onlytiancai@gmail.com>
 * MIT Licensed
 */

var utils = require('../utils');
var logger = require('../logger').logger;

/*
* 跟踪一个事件
*/

function track(app_id, user_id, event_name, event_value, event_time, properties, callback) {
    if (!(app_id && user_id && event_name)) {
        throw Error("app_id, user_id, event_name all required."); 
    }

    event_value = event_value || 0;
    event_time = event_time || new Date();
    properties = properties || {};
    properties = JSON.stringify(properties);

    var sql = "insert into events(app_id, user_id, event_name, event_value, event_time, properties)"
        + " values(?, ?, ?, ?, ?, ?)";
    var args = [app_id, user_id, event_name, event_value, event_time, properties];

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

function query(appid, event_name, from_date, to_date, type, metrics, where) {

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
