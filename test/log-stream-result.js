
var tap           = require( 'tap' )
,   test          = tap.test

test( 'log-stream-channels', function ( t ) {

    var LogStream = require( '../index.js' );
    t.ok( LogStream, "loaded" );

    var log = LogStream({prefix:'local1'})

    t.test('log-stream errorObject', {parallel: false}, function (t) {
        var r = log.error('test', {x:1})
        t.ok(r.errorObject.message === 'test', 'errorObject.message contains expected value')
        t.ok(r.errorObject.data.x === 1, 'errorObject.data contains expected value')
        t.ok(r.errorObject.level === 'error', 'errorObject.level contains expected value')
        t.end()
    })

    t.test('log-stream callWithError', {parallel: false}, function (t) {
        var r = log.error('test', {x:1})
        t.ok(typeof r.andCallWithError === 'function', 'andCallWithError is function')
        t.ok(typeof r.callWithError === 'function', 'callWithError is function')
        r.andCallWithError(function (err) {
            t.ok(r.errorObject === err, 'andCallWithError callback executed with expected error object')
        })
        r.callWithError(function (err) {
            t.ok(r.errorObject === err, 'callWithError callback executed with expected error object')
        })
        t.end()
    })
})
