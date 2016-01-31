/*
 * 数据存储用mysql
 */

var utils = require('../utils');

exports.add_event = function(
    app_id,
    user_id,
    event_name, 
    event_value,
    event_time,
    properties,
    callback){

    var sql = "insert into events(app_id, user_id, event_name, event_value," +
        "event_time, properties) values(?, ?, ?, ?, ?, ?)";
    var args = [app_id, user_id, event_name, event_value, event_time,
        properties];

    utils.execute_sql(sql, args, function(err){
        if (err) {
            logger.log('error', 'events.track err: %s', err);
        }
        callback(err);
    });
};

exports.fetch_events = function(
    offset,
    limit,
    app_id,
    user_id,
    event_name,
    from_date,
    to_date,
    callback) {


    var sql = 'select * from events where app_id = ? and user_id = ? and ' +
        'event_name = ? and event_time >= ? and event_time <= ? limit ?, ?';
    var args = [app_id, user_id, event_name, from_date.toDate(), 
        to_date.toDate(), offset, limit];

    utils.execute_sql(sql, args, function(err, rows, fields){
        if (err) return callback(err);
        if (rows.length === 0) return callback(null, []);

        callback(null, rows);
    });

};
