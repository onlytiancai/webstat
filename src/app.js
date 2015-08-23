var http = require('http'),
    config = require('config'),
    logger = require('./logger').logger,
    model = require('./model');

var IP = config.get('listen_ip'),
    PORT = config.get('listen_port');

http.createServer(function(req, res) {
    logger.log('info', 'recive req: %s', req.url);
    model.add_event(123, 'click', 30);
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    res.end('Hello world\n');
}).listen(PORT, IP);
model.run_syncdb_worker();


logger.log('info', 'Server runinig at %s:%s', IP, PORT);
