
var Throttle = require('../index.js').Throttle;
var ThrottleGroup = require('../index.js').ThrottleGroup;

var sendStr = (function() {
    var s = '0123456789xyzXYZ?!\0åéîõü$£€*<>'; // 30 characters
    for (var i = 0, str = ''; i < 1000; i++)
        str += s;
    return str; // 30K characters
})();

var opts = {rate: 100000}; // 100 KiB/s

var testSendRecv = function(t, cb) {
    var recvStr = '';
    t.on('data', function(chunk) {
        recvStr += chunk;
    });
    t.on('end', function() {
        cb(sendStr == recvStr);
    });
    t.write(sendStr, function() {
        t.end();
    });
};

exports.testThrottle = function(test) {
    var t = new Throttle(opts);

    test.expect(1);
    testSendRecv(t, function(ok) {
        test.ok(ok, "received string should equal sent string");
        test.done();
    });
};

exports.testGroupThrottle = function(test) {
    var testCount = 3, doneCount = 0;
    var tg = new ThrottleGroup(opts);

    test.expect(testCount);
    for (var i = 0; i < testCount; i++) {
        testSendRecv(tg.throttle(), function(ok) {
            test.ok(ok, "received string should equal sent string");
            if (++doneCount == testCount)
                test.done();
        });
    }
};
