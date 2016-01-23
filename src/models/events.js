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

function group(memo, data, type, groupOn, metrics) {
    var groups = _(data).groupBy(groupOn); // TODO; groupOn err
    var result = _(groups).map(function(g, key) {
        var ret = {};
        ret[groupOn] = key;
        g = _.pluck(g, metrics);
        g = _.map(g, function(x) { return parseInt(x, 10); });

        var memo_obj = _.filter(memo, function(x) {return x[groupOn] == key;});
        var memo_value = undefined, memo_count = undefined, memo_sum = undefined;

        if (memo_obj.length > 0) {
            memo_value = memo_obj[0][metrics];
            memo_count = memo_obj[0]['count_'];
            memo_sum = memo_obj[0]['sum_'];
        }

        ret['count_'] = g.length;
        if (memo_count != undefined) {
            ret['count_'] += memo_count;
        }

        ret['sum_'] = _(g).reduce(function(m, x) { return m + x; }, 0);
        if (memo_sum != undefined) {
            ret['sum_'] += memo_sum;
        }

        switch (type){
            case "count":
                ret[metrics] = ret['count_']; 
                break;
            case "sum":
                ret[metrics] = ret['sum_']; 
                break;
            case "avg":
                ret[metrics] = ret['sum_'] / ret['count_']; 
                break;
            case "min":
                ret[metrics] = _.min(g);
                if (memo_value != undefined) {
                    ret[metrics] = _.min([memo_value, ret[metrics]]);
                }
                break;
            case "max":
                ret[metrics] = _.max(g);
                if (memo_value != undefined) {
                    ret[metrics] = _.max([memo_value, ret[metrics]]);
                }
                break;
            default:
                throw Error("unknow type: " + type);
        }
        return ret;
    });

    return result;
}

function processData(memo, type, groupOn, strWhere, metrics, getRows, callback) {
    getRows(function(err, rows){
        if (err) return callback(err, null);
        if (rows.length === 0) return callback(null, memo);

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

        var ret = group(memo, data, type, groupOn, metrics);
        processData(ret, type, groupOn, strWhere, metrics, getRows, callback);
    });
}

function getRows(app_id, user_id, event_name, from_date, to_date) {
    var page = 0, pageSize = 2;

    return function(callback) {
        var offset = page * pageSize;
        page = page + 1;

        var sql = 'select * from events where app_id = ? and user_id = ? and ' +
            'event_name = ? and event_time >= ? and event_time <= ? limit ?, ?';
        var args = [app_id, user_id, event_name, from_date.toDate(), 
            to_date.toDate(), offset, pageSize];

        utils.execute_sql(sql, args, function(err, rows, fields){
            if (err) return callback(err);
            if (rows.length === 0) return callback(null, []);

            callback(null, rows);
        });
    };
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
    var from_date = options.from_date ? 
        moment(options.from_date, 'YYYY-MM-DD') : moment();
    var to_date = options.to_date ? 
        moment(options.to_date, 'YYYY-MM-DD') : moment();
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

    var fnGetRows = getRows(app_id, user_id, event_name, from_date, to_date);
    processData([], type, groupOn, strWhere, metrics, fnGetRows, callback);

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
