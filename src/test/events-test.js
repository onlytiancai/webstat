var assert = require('assert');
var uuid = require('node-uuid');
var events = require('../models/events');
var utils = require('../utils');

describe('events', function(){
    var app_id, user_id;
    var event_name = 'star';
    var event_value = 1;
    var properties = {
        name: 'node-uuid',
        url: 'https://github.com/broofa/node-uuid.git'
    };
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

    it('track ing', function(done){
        events.track({
            app_id: app_id,
            user_id: user_id,
            event_name: event_name,
            event_value: event_value,
            event_time: event_time
        },
        properties,
        function(err) {
            if (err) throw err;
            done(); 
        });
    });

    it('query ing', function(done){
        events.query({
            app_id: app_id,
            user_id: user_id,
            event_name: event_name,
            from_date: new Date(),
            to_date: new Date(),
            type: 'count',
            metrics: 'value'
        },
        '',
        function(err, data){
            if (err) throw err;
            console.log(data);
            assert.equal(1, data.length);
            assert.equal(event_name, data[0].event_name);
            var row_properties = JSON.parse(data[0].properties);
            assert.deepEqual(row_properties, properties)
            done();
        });
    });
});
