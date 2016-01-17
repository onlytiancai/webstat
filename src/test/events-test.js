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
            events.query({
                app_id: app_id,
                user_id: user_id,
                event_name: event_name,
                from_date: '2016-01-01',
                to_date: '2016-01-01',
                type: 'count',
                metrics: 'value'
            },
            'name == "express"',
            function(err, data){
                if (err) throw err;
                console.log(data);
                assert.equal(1, data.length);
                done();
            });
        });
    });
});
