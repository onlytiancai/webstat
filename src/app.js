var http = require('http'),
    config = require('config'),
    logger = require('./logger').logger;

http.createServer(function(req, res) {
    logger.log('info', 'recive req: %s', req.url);
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    res.end('Hello world\n');
}).listen(config.get('listen_port'), config.get('listen_ip'));


logger.info('Server runinig at 127.0.0.1');
