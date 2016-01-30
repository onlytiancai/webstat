/* 演示流的限速, 读取到n个数据，批量写一次 */

var stream = require('stream');
var util = require('util');
var byline = require('byline');

function BulkStream(batch, interval){
    stream.Transform.call(this);

    this._readableState.objectMode = true;
    this._writableState.objectMode = true;
    this._batch = batch || 3;
    this._cache = [];
    this._interval = interval || 1000;
    this._runner = null;
    this._last_cb = null;
   }

util.inherits(BulkStream, stream.Transform);

BulkStream.prototype._transform = function(obj, encoding, cb){
    var that = this;
    obj = obj.toString().trim();
    obj && this._cache.push(obj);

    if (this._cache.length == this._batch) {
        this.push(JSON.stringify(this._cache));
        this._cache = [];
    }

    this._last_cb && this._last_cb();
    this._last_cb = cb;

    if (this._runner == null) {
        this._runner = setTimeout(function(){
            clearTimeout(that._runner);
            that._runner = null;

            if (that._cache.length > 0) {
                that.push(JSON.stringify(that._cache));
                that._cache = [];
            }

            that._last_cb && that._last_cb();
            that._last_cb = null;
        }, this._interval);
    }
};

BulkStream.prototype._flush = function(done){
    clearTimeout(this._runner);
    if(this._cache.length > 0) {
        this.push(JSON.stringify(this._cache));
    }
    done();
};

process.stdin
    .pipe(new BulkStream(3, 2000))
    .pipe(process.stdout);
