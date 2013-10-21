var inherits = require('util').inherits;
var Transform = require('stream').Transform;
var TokenBucket = require('limiter').TokenBucket;

module.exports = Throttle;

function Throttle(opts) {
    if (!(this instanceof Throttle))
        return new Throttle(opts);

    opts = opts || {};
    if (opts.rate === undefined)
        throw new Error('Throttle constructor requires rate argument');
    if (typeof opts.rate !== 'number' || opts.rate <= 0)
        throw new Error('Throttle rate must be a positive number');
    if (opts.chunksize !== undefined && (typeof opts.chunksize !== 'number' || opts.chunksize <= 0)) {
        throw new Error('Throttle chunk size must be a positive number');
    }

    Transform.call(this, opts);

    this.rate = opts.rate;
    this.chunksize = opts.chunksize || this.rate/10;
    this.bucket = new TokenBucket(this.rate, this.rate, 'second', null);
}
inherits(Throttle, Transform);

Throttle.prototype._transform = function(chunk, encoding, done) {
    process(this, chunk, 0, done);
};

function process(self, chunk, pos, done) {
    var slice = chunk.slice(pos, pos + self.chunksize);
    if (!slice.length) {
        // chunk fully consumed
        done();
        return;
    }
    self.bucket.removeTokens(slice.length, function(err) {
        if (err) {
            done(err);
            return;
        }
        self.push(slice);
        process(self, chunk, pos + self.chunksize, done);
    });
}
