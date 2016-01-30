var stream = require('stream');
var util = require('util');

/* 
 * 对输入流进行定时写和批量写, 以及限速，提高写性能
 *      batch: 收到多少次请求批量写一次, 默认3个一批
 *      interval: 定时多少毫秒写一次, 默认1秒刷新一次
 *      maxCount: interval时间内最多读多少次数据, 默认1秒1个
 * */
function BulkStream(batch, interval, maxCount){
    stream.Transform.call(this);

    this._readableState.objectMode = true;
    this._writableState.objectMode = true;
    this._batch = batch || 3;
    this._cache = [];
    this._interval = interval || 1000;
    this._maxCount = maxCount || interval / 1000;
    this._runner = null;
    this._count = 0;
}

util.inherits(BulkStream, stream.Transform);

BulkStream.prototype._transform = function(obj, encoding, cb){
    this._count++;
    if (this._count > this._maxCount) {
        this.emit('overload');
        return cb();
    }

    var that = this;
    obj = obj.toString().trim();
    obj && this._cache.push(obj);

    if (this._cache.length == this._batch) {
        this.push(JSON.stringify(this._cache));
        this._cache = [];
    }

    if (this._runner == null) {
        this._runner = setTimeout(function(){
            clearTimeout(that._runner);
            that._runner = null;

            that._count = 0;

            if (that._cache.length > 0) {
                that.push(JSON.stringify(that._cache));
                that._cache = [];
            }

        }, this._interval);
    }

    cb();
};

BulkStream.prototype._flush = function(done){
    clearTimeout(this._runner);
    if(this._cache.length > 0) {
        this.push(JSON.stringify(this._cache));
    }
    done();
};

var bs = new BulkStream(3, 3000, 3)
    .on('overload', function(){
        console.log('overload ...'); 
    });

process.stdin
    .pipe(bs)
    .pipe(process.stdout);
