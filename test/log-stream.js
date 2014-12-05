var test      = require('tape'),
    logStream = require('..')
require('./polyfills')

test( 'log-stream', function ( t ) {

    var log = logStream({name:'test'})

    t.test('levels', {parallel: true}, function (t) {
        t.plan(11)

        var expect = ['Debug','Info','Warn','Error','Fatal']
        log.stream.on('data', function (data) {
            data = JSON.parse(data)
            expect.splice(expect.indexOf(data.msg),1)
            if (!expect.length) {
                t.ok(true, 'Got all expected log messages on root stream.')
            }
        })

        var custom = log.createStream('error')
        var customExpect = ['Error','Fatal']
        custom.on('data', function (data) {
            data = JSON.parse(data)
            var expectIdx = customExpect.indexOf(data.msg)
            if (expectIdx < 0)
                t.ok(false, 'Got an unexpected log level "'+data.level+'" in custom stream (error/fatal).')
            else {
                customExpect.splice(expectIdx,1)
                if (!customExpect.length) {
                    t.ok(true, 'Got all expected log messages on custom (error/fatal) stream.')
                }
            }
        })

        log.debug.stream.on('data', function (data) {
            data = JSON.parse(data)
            if (data.msg === 'Debug') {
                t.ok(true, 'Got expected message on debug channel.')
            } else {
                t.ok(false, 'Got unexpected message on debug channel.')
            }
        })

        log.info.stream.on('data', function (data) {
            data = JSON.parse(data)
            if (data.msg === 'Info') {
                t.ok(true, 'Got expected message on info channel.')
            } else {
                t.ok(false, 'Got unexpected message on info channel.')
            }
            t.ok(data.additional, 'Got expected extra property on info channel.')
        })

        log.warn.stream.on('data', function (data) {
            data = JSON.parse(data)
            if (data.msg === 'Warn') {
                t.ok(true, 'Got expected message on warn channel.')
            } else {
                t.ok(false, 'Got unexpected message on warn channel.')
            }
        })

        log.error.stream.on('data', function (data) {
            data = JSON.parse(data)
            if (data.msg === 'Error') {
                t.ok(true, 'Got expected message on error channel.')
            } else {
                t.ok(false, 'Got unexpected message on error channel.')
            }
        })

        log.fatal.stream.on('data', function (data) {
            data = JSON.parse(data)
            if (data.msg === 'Fatal') {
                t.ok(true, 'Got expected message on fatal channel.')
            } else {
                t.ok(false, 'Got unexpected message on fatal channel.')
            }
        })
    })

    process.nextTick(function () {
        log.debug('De%s', 'bug')
        log( {additional:true}, 'Inf%s', 'o') // This is default channel
        log( 'info', {additional:true}, 'Inf%s', 'o') // This is default channel
        log.warn('Warn')
        log.error('Error')
        log.fatal('Fatal')
    })

    t.end()
})
