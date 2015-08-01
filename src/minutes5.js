var moment = require('moment');

exports.format = function(input) {
    var time = moment(input);
    var minutes = time.minutes();
    minutes = minutes - (minutes % 5);
    time = time.seconds(0).millisecond(0).minutes(minutes);
    return time.format('YYYY-MM-DD HH:mm:ss');
};
