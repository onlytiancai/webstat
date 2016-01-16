var app=require('express')(); 
    config = require('config'),
    logger = require('./logger').logger,
    model = require('./model');

var ip = config.get('listen_ip'),
    port = config.get('listen_port');


app.get('/add_event/:appid([0-9]+)/:name([0-9a-zA-Z_-]+)/:value([0-9]+)', function(req, res){                                            
    model.add_event(
        req.params.appid,
        req.params.name,
        req.params.value
        );
    res.send('ok\n');
});         

model.run_syncdb_worker();

var server = app.listen(port, ip, function () {
    var host = server.address().address;
    var port = server.address().port;
    logger.log('info', 'Server runinig at %s:%s', host, port);
});
