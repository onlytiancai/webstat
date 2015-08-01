var moment = require('moment');

// 格式化时间为统一粒度，默认为5分钟粒度，如11:23 -> 11:20, 11:27 - > 11:25
exports.fixtime = function(input, fix) {
    if (!input) return;
    fix = fix || 5;

    var time = moment(input),
        minutes = time.minutes();
    minutes = minutes - (minutes % fix);
    time = time.seconds(0).millisecond(0).minutes(minutes);
    return time.format('YYYY-MM-DD HH:mm:ss');
};


