var assert = require("assert"),
    utils = require('./utils'),
    moment = require('moment');

describe('utils', function() {
    describe('#fixtime()', function() {
        it('格式化成5分钟', function() {
            var time = '2015-03-05 14:21:11';
            assert.equal('2015-03-05 14:20:00', utils.fixtime(time));

            time = '2013-03-05 14:17:32';
            assert.equal('2013-03-05 14:15:00', utils.fixtime(time));
        })
    })
});
