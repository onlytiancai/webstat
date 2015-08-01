var assert = require("assert"),
    model = require('./model');

describe('model', function() {
    describe('#add_event()', function() {
        it('add_event', function() {
            var ret = model.add_event('123', 'button_click', 20);
            assert.equal(0, ret);
        })
    })
});



