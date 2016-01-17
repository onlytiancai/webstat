var assert = require('assert');
var uuid = require('node-uuid');
var async = require('async');
var moment = require('moment');
var events = require('../models/events');
var utils = require('../utils');

describe('events', function(){
    var app_id, user_id;
    var event_name = 'star';
    var event_value = 1;
    var event_time = new Date();

    before(function(){
        app_id = uuid.v4(); 
        user_id = uuid.v4();
    });

    after(function(done){
        var sql = 'delete from events where app_id = ?'; 
        utils.execute_sql(sql, [app_id], function(err){
            if (err) console.log("after error: " + err);
            done();
        });
    });

    function track(properties, value, done) {
        events.track({
            app_id: app_id,
            user_id: user_id,
            event_name: event_name,
            event_value: value,
            event_time: event_time
        },
        properties,
        function(err) {
            if (err) throw err;
            done(); 
        });
    }

    function query(type, metrics, callback){
        events.query({
            app_id: app_id,
            user_id: user_id,
            event_name: event_name,
            from_date: moment().format('YYYY-MM-DD'),
            to_date: moment().format('YYYY-MM-DD'),
            type: type,
            metrics: metrics 
        },
        'name == "express"',
        function(err, data){
            if (err) throw err;
            console.log(data);
            callback(data);
        });
    }

    it('track ing', function(done){
        track({
            name: 'node-uuid',
            url: 'https://github.com/broofa/node-uuid.git'
        }, 5, done);
    });

    it('query ing', function(done){
        async.parallel([
            function(callback){
                track({
                    name: 'express',
                    url: 'https://github.com/strongloop/express.git'
                }, 7, callback);
            },
            function(callback){
                track({
                    name: 'express',
                    url: 'https://github.com/strongloop/express.git'
                }, 3, callback);
            }
        ], function(){
            async.series([
                function(callback){
                    query('count', 'value', function(data){
                        assert.equal(2, data[0].value)
                        callback(null); 
                    }); 
                },
                function(callback){
                    query('sum', 'value', function(data){
                        assert.equal(10, data[0].value)
                        callback(null); 
                    }); 
                },
                function(callback){
                    query('avg', 'value', function(data){
                        assert.equal(5, data[0].value)
                        callback(null); 
                    }); 
                }, 
                function(callback){
                    query('min', 'value', function(data){
                        assert.equal(2, data[0].value)
                        callback(null); 
                    }); 
                },
                function(callback){
                    query('max', 'value', function(data){
                        assert.equal(7, data[0].value)
                        callback(null); 
                    }); 
                } 
            ],function(){done()});
        });
    });
});
