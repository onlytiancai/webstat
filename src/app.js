var http = require('http');
var winston = require('winston');

winston.handleExceptions(new winston.transports.File({
    filename: 'exception.log'
}))

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)(),
        new(winston.transports.File)({
            filename: 'log.log'
        })
    ]
});

http.createServer(function(req, res) {
    logger.log('info', 'recive req: %s', req.url);
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    res.end('Hello world\n');
}).listen(1337, '127.0.0.1');


console.log('Server runinig at 127.0.0.1');
