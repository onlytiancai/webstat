var assert = require("assert");
var model = require('./model');
var utils = require('./utils');

describe('model', function() {
    describe('#add_event()', function() {
        it('add_event', function() {
            var ret = model.add_event('123', 'button_click', 20);
            assert.equal(0, ret);
        })
    })
});

describe('model', function() {
    describe('#add_event_to_db()', function() {
        it('add_event_to_db', function(done) {
            var appid = 123,
                name = 'btn_click',
                hits = 1,
                value = 5,
                created_at = utils.fixtime();

            model.add_event_to_db(appid, name, hits, value,
                created_at, function(err){
                    if (err) throw err;
                    done();
                }
            );
        });
    })
});
