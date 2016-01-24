/*!
 * Copyright(c) 2015-2016 onlytiancai <onlytiancai@gmail.com>
 * MIT Licensed
 */

var utils = require('../utils');
var jsonWhere = require('../libs/json-where');
var logger = require('../logger').logger;
var _ = require('underscore');
var moment  = require('moment');
var async = require('async');

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

// TODO: 有多余计算
function calcMemo(memo, list, metrics, groupOn, key){
    var count = 0, sum = 0, avg = 0, min = 0,
        max = 0, found = undefined; 

    list = _.pluck(list, metrics);
    list = _.map(list, function(x) { return parseInt(x, 10); });
    count = list.length;
    sum = _(list).reduce(function(m, x) { return m + x; }, 0);
    max = _.max(list);
    min = _.min(list);

    found = _.filter(memo, function(x) {return x[groupOn] == key;});

    if (found.length > 0) {
        count += found[0]['count_'];
        sum += found[0]['sum_'];
        avg = sum / count;
        max = _.max([max, found[0]['max_']]);
        min = _.min([min, found[0]['min_']]);
    }

    return { count_: count, sum_: sum, avg_: avg, min_: min, max_: max };
}

function getData(rows, memo, metrics, groupOn, strWhere, type){
    return _.chain(rows).map(function(row){
        var properties = JSON.parse(row.properties); 
        properties.value = row.event_value;
        properties.date = moment(row.event_time).format('YYYY-MM-DD');
        properties.hour = moment(row.event_time).format('hh');
        return properties;
    })
    .filter(jsonWhere(strWhere))
        .groupBy(groupOn) 
        .map(function(g, key) {
            var ret  = calcMemo(memo, g, metrics, groupOn, key);
            ret[groupOn] = key;
            ret[metrics] = ret[type + '_'];
            return ret;
        })
    .value();
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

    if(!_.contains(['count', 'sum', 'avg', 'min', 'max'], type)){
        throw Error("arg type err: " + type); 
    }

    // TODO; groupOn err

    var fn = getRows(app_id, user_id, event_name, from_date, to_date);
    var stop = false;
    var memo = [];
    async.whilst(
        function () { return !stop },
        function (callback) {
            fn(function(err, rows){
                if (err) return callback(err, null);
                stop = rows.length == 0;
                if(rows.length == 0) return callback(null, memo);

                memo = getData(rows, memo, metrics, groupOn, strWhere, type);
                callback(null, memo);
            });
        },
        function (err, n) {
            return callback(err, _.map(memo, function(x){
                delete x['count_'];
                delete x['sum_'];
                delete x['avg_'];
                delete x['max_'];
                delete x['min_'];
                return x;
            }));
        }
    );
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
