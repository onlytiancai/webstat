var assert = require('assert');
var uuid = require('node-uuid');
var events = require('../models/events');

describe('events', function(){
    var app_id, user_id;

    before(function(){
        app_id = uuid.v4(); 
        user_id = uuid.v4();
    });

    it('track', function(done){
        var event_name = 'star';
        var event_value = 1;
        var properties = {
            name: 'node-uuid',
            url: 'https://github.com/broofa/node-uuid.git'
        };
        var event_time = new Date();

        events.track(
            app_id, 
            user_id, 
            event_name,
            event_value,
            event_time,
            properties,
            function(err) {
                if (err) throw err;
                done(); 
            });
    });
});
