/*!
 * Copyright(c) 2015-2016 onlytiancai <onlytiancai@gmail.com>
 * MIT Licensed
 */

var utils = require('../utils');
var jsonWhere = require('../libs/json-where');
var logger = require('../logger').logger;
var _ = require('underscore');
var moment  = require('moment');

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

function query(options, strWhere, callback) {
    if (! (options.app_id && options.user_id && options.event_name)) {
        throw Error("app_id, user_id, event_name all required."); 
    }

    var app_id = options.app_id;
    var user_id = options.user_id;
    var event_name = options.event_name;
    var from_date = options.from_date ? moment(options.from_date, 'YYYY-MM-DD') : moment();
    var to_date = options.to_date ? moment(options.to_date, 'YYYY-MM-DD') : moment();
    var type = options.type || 'count';
    var metrics = options.metrics || 'value';
    var groupOn = options.on || 'date';
    strWhere = strWhere || '';

    from_date = from_date.hour(0).minute(0).second(0); // TODO: utc
    to_date = to_date.hour(23).minute(59).second(59);
    var diff = moment.duration(to_date.diff(from_date));
    if (groupOn == 'hour' && diff.days() > 1) {
        throw Error('date diff to far when on = hour'); // TODO 
    }

    var sql = 'select * from events where app_id = ? and user_id = ? and ' +
        'event_name = ? and event_time >= ? and event_time <= ?';
    var args = [app_id, user_id, event_name, from_date.toDate(), to_date.toDate()];

    utils.execute_sql(sql, args, function(err, rows, fields){
        if (err) return callback(err);
        if (rows.length == 0) return callback(null, []);

        var data = [];
        rows.forEach(function(row){
            var properties = JSON.parse(row.properties); 
            properties.value = row.event_value;
            properties.date = moment(row.event_time).format('YYYY-MM-DD');
            properties.hour = moment(row.event_time).format('hh');
            if (jsonWhere(strWhere)(properties)) {
                data.push(properties); 
            }
        });

        var groups = _(data).groupBy(groupOn); // TODO; groupOn err
        var result = _(groups).map(function(g, key) {
            var ret = {};
            ret[groupOn] = key;
            g = _.pluck(g, metrics);
            g = _.map(g, function(x) {return parseInt(x)});
            switch (type){
                case "count":
                    ret[metrics] = g.length;
                    break;
                case "sum":
                    ret[metrics] = _(g).reduce(function(m, x) { return m + x; }, 0);
                    break;
                case "avg":
                    ret[metrics] = _(g).reduce(function(m, x) { return m + x; }, 0);
                    ret[metrics] = ret[metrics] / (g.length === 0 ? 1 : g.length);
                    break;
                case "min":
                    ret[metrics] = _.min(g);
                    break;
                case "max":
                    ret[metrics] = _.max(g);
                    break;
                default:
                    throw Error("unknow type: " + type);
            }
            return ret;
        });
        callback(null, result);
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
