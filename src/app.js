var http = require('http');
var winston = require('winston');
var config = require('config');

winston.handleExceptions(new winston.transports.File({
    filename: config.get('log.exception_path'),
    json: false
}));

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)(),
        new(winston.transports.File)({
            filename: config.get('log.log_path'),
            maxsize: 1024 * 1024 * 10, // 10MB
            maxFiles: 3,
            json: false,
            timestamp: function() {
                return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            },
            formatter: function(options) {
                return [options.timestamp(),
                    options.level.toUpperCase(),
                    options.message
                ].join(' ');
            }
        })
    ]
});

http.createServer(function(req, res) {
    logger.log('info', 'recive req: %s', req.url);
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    res.end('Hello world\n');
}).listen(config.get('listen_port'), config.get('listen_ip'));


logger.info('Server runinig at 127.0.0.1');
