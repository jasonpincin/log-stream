var test      = require('tape'),
    logStream = require( '..' )
require('./polyfills')


test('log-stream-channels', function (t) {

    var log = logStream({name:'test'})

    t.test('log-stream errorObject', {parallel: false}, function (t) {
        var r = log.error({x:1}, 'test')
        t.equal(r.errorObject.message, 'test', 'errorObject.message contains expected value')
        t.equal(r.errorObject.log.x, 1, 'errorObject.log.x contains expected value')
        t.equal(r.errorObject.log.level, 50, 'errorObject.log.level contains expected value')
        t.end()
    })

    t.test('log-stream andCallWithError', {parallel: false}, function (t) {
        var r = log.error('test', {x:1})
        t.ok(typeof r.andCallWithError === 'function', 'andCallWithError is function')
        r.andCallWithError(function (err) {
            t.ok(r.errorObject === err, 'andCallWithError callback executed with expected error object')
        })
        t.end()
    })
})
