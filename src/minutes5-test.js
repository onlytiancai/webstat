var assert = require("assert");
var minutes5 = require('./minutes5');
var moment = require('moment');

describe('minutes5', function() {
    describe('#format()', function() {
        it('格式化成5分钟', function() {
            var time = '2015-03-05 14:21:11';
            assert.equal('2015-03-05 14:20:00', minutes5.format(time));

            time = '2013-03-05 14:17:32';
            assert.equal('2013-03-05 14:15:00', minutes5.format(time));
        })
    })
});
