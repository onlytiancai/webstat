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

var db = require('./mysql_db');

/*
* 跟踪一个事件
*/
function track(options, properties, callback) {
    if (! (options.app_id && options.user_id && options.event_name)) {
        throw Error("app_id, user_id, event_name all required."); 
    }

    var app_id = options.app_id;
    var user_id = options.user_id;
    var event_name = options.event_name;
    var event_value = options.event_value || 0;
    var event_time = options.event_time || new Date();
    properties = properties || {};
    properties = JSON.stringify(properties);

    db.add_event(
        app_id,
        user_id,
        event_name,
        event_value,
        event_time, 
        properties,
        callback);

}

// TODO: 有多余计算
function calcGroup(metrics, groupOn, type){
    return function(list, key) {
        var count = 0, sum = 0, avg = 0, min = 0,
            max = 0, found = null; 

        list = _.pluck(list, metrics);
        list = _.map(list, function(x) { return parseInt(x, 10); });
        count = list.length;
        sum = _(list).reduce(function(m, x) { return m + x; }, 0);
        max = _.max(list);
        min = _.min(list);

        var ret = { count_: count, sum_: sum, avg_: avg, min_: min, max_: max };
        ret[groupOn] = key;
        ret[metrics] = ret[type + '_'];

        return ret;
    };
}

function getPropertiesByRow(row) {
    var properties = JSON.parse(row.properties); 
    properties.value = row.event_value;
    properties.date = moment(row.event_time).format('YYYY-MM-DD');
    properties.hour = moment(row.event_time).format('hh');
    return properties;
}

function processResult(x){
    delete x.count_;
    delete x.sum_;
    delete x.avg_;
    delete x.max_;
    delete x.min_;
    return x;
}

function mergeData(data, newData, groupOn, metrics, type) {
    _.each(newData, function(item){
        var found = _.filter(data, function(x) {
            return x[groupOn] == item[groupOn];
        });

        if (found.length > 0) {
            found[0].count_ += item.count_;
            found[0].sum_ += item.sum_;
            found[0].avg_ = found[0].sum_ / found[0].count_;
            found[0].max_ = _.max([item.max_, found[0].max_]);
            found[0].min_ = _.min([item.min_, found[0].min_]);
            found[0][metrics] = found[0][type + '_'];

        }else {
            data.push(item);
        }
    });

    return data;
}

function getRows(app_id, user_id, event_name, from_date, to_date) {
    var page = 0, pageSize = 2;

    return function(callback) {
        var offset = page * pageSize;
        page = page + 1;

        db.fetch_events( offset, pageSize, app_id, user_id, event_name,
            from_date, to_date, callback); 
    };
}


function calcData(getData, strWhere, groupOn, metrics, type, callback) {
    return function(callback){
        getData(function(err, rows){
            if (err) return callback(err, null);

            var ret = {rowLength: rows.length, memo: []};
            if(rows.length === 0) return callback(null, ret);

            ret.memo = _.chain(rows).map(getPropertiesByRow)
            .filter(jsonWhere(strWhere))
            .groupBy(groupOn) 
            .map(calcGroup(metrics, groupOn, type))
            .value();

            callback(null, ret);
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
    
    var fnGetRows = getRows(app_id, user_id, event_name, from_date, to_date); 
    var fnCalcData = calcData(fnGetRows, strWhere, groupOn, metrics, type);
    var stop = false, data = []; //必须外部变量hold住回调结果，否则就undefined了

    async.whilst(
        function() { return !stop; },
        function(callback) {
            fnCalcData(function(err, ret) {
                stop = ret.rowLength == 0;
                data = mergeData(data, ret.memo, groupOn, metrics, type);
                callback(err, data); 
            });
        },
        function (err, n) {
            return callback(err, _.map(data, processResult));
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
