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

describe('model', function() {
    describe('#merge_events()', function() {
        it('merge_events', function() {
            var args = ['0/a/2013-01-01/10', '0/a/2013-01-01/5', 
                '1/a/2013-01-01/7'];
            var ret = model.merge_events(args);
            assert.equal(2, ret.length);
            assert.equal(2, ret[0].hits);
            assert.equal(15, ret[0].value);
        })
    })
});

describe('model', function() {
    describe('#sync_to_db()', function() {
        it('sync_to_db', function(done) {
            model.sync_to_db(function(err){
                    if (err) throw err;
                    done();
                }
            );
        });
    })
});
