var inherits = require('util').inherits;
var Transform = require('stream').Transform;
var TokenBucket = require('limiter').TokenBucket;

function Throttle(opts, group) {
    var group;
    if (group === undefined)
        group = new ThrottleGroup(opts);
    this.bucket = group.bucket;
    this.chunksize = group.chunksize;
    Transform.call(this, opts);
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

function ThrottleGroup(opts) {
    if (!(this instanceof ThrottleGroup))
        return new ThrottleGroup(opts);

    opts = opts || {};
    if (opts.rate === undefined)
        throw new Error('throttle rate is a required argument');
    if (typeof opts.rate !== 'number' || opts.rate <= 0)
        throw new Error('throttle rate must be a positive number');
    if (opts.chunksize !== undefined && (typeof opts.chunksize !== 'number' || opts.chunksize <= 0)) {
        throw new Error('throttle chunk size must be a positive number');
    }

    this.rate = opts.rate;
    this.chunksize = opts.chunksize || this.rate/10;
    this.bucket = new TokenBucket(this.rate, this.rate, 'second', null);
}

ThrottleGroup.prototype.throttle = function(opts) {
    return new Throttle(opts, this);
}

module.exports = {
    Throttle: Throttle,
    ThrottleGroup: ThrottleGroup
};