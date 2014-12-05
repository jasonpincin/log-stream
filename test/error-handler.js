var test      = require('tape'),
    logStream = require( '..' )
require('./polyfills')


test('log-stream errorHandler', function (t) {

    var log             = logStream({name:'test'}),
        errHandlerError = log.errorHandler(),
        errHandlerWarn  = log.errorHandler('warn'),
        errHandlerMsg   = log.errorHandler('this is a test')

    t.equal(typeof errHandlerError, 'function', 'errorHandler returns a function')
    t.equal(typeof errHandlerWarn, 'function', 'errorHandler returns a function')
    t.equal(typeof errHandlerMsg, 'function', 'errorHandler returns a function')

    var messages = []
    log.stream.on('data', function (message) {
        messages.push(message)
    })

    errHandlerError(new Error('error message'))
    errHandlerError('non-object error message')
    errHandlerWarn(new Error('warning'))
    errHandlerMsg(new Error('informative'))
    errHandlerMsg() // should result in no log

    process.nextTick(function () {
        t.equal(messages.length, 4, 'received error handler messages')
        t.equal(messages.filter(function (msg) { return JSON.parse(msg).msg === 'error message'}).length, 1, 'found error message')
        t.equal(messages.filter(function (msg) { return JSON.parse(msg).msg === 'non-object error message'}).length, 1, 'found non-object error message')
        t.equal(messages.filter(function (msg) { return JSON.parse(msg).msg === 'warning'}).length, 1, 'found warning message')
        t.equal(messages.filter(function (msg) { return JSON.parse(msg).msg === 'this is a test'}).length, 1, 'found informative message')
        t.end()
    })
})
