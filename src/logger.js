var winston = require('winston'),
    config = require('config'),
    moment = require('moment');

/* 暂时去掉这个注释，否则mocha测试时，不能够暴露异常
winston.handleExceptions(new winston.transports.File({
    filename: config.get('log.exception_path'),
    json: false
}));
*/

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)({
            level: config.get('log.level') 
        }),
        new(winston.transports.File)({
            filename: config.get('log.log_path'),
            maxsize: 1024 * 1024 * 10, // 10MB
            maxFiles: 3,
            json: false,
            timestamp: function() {
                return moment().format('YYYY-MM-DD HH:mm:ss'); 
            },
            formatter: function(options) {
                return [options.timestamp(),
                    options.level.toUpperCase(),
                    options.message
                ].join(' ');
            },
            level: config.get('log.level') 
        })
    ]
});

exports.logger = logger;
