var tap           = require( 'tap' )
,   test          = tap.test

test( 'log-stream-channels', function ( t ) {

    LogStream = require( '../index.js' );
    t.ok( LogStream, "loaded" );

    var log = LogStream()

    t.test('log-stream-levels', {parallel: true}, function (t) {
        t.plan(7)

        var expect = ['Debug','Info','Warn','Error','Fatal']
        log.on('data', function (data) {
            expect.splice(expect.indexOf(data.message),1)
            if (!expect.length) {
                t.ok(true, 'Got all expected log messages on root stream.')
            }
        })

        log.debug.on('data', function (data) {
            var data = JSON.parse(data)
            if (data.message == 'Debug') {
                t.ok(true, 'Got expected message on debug channel.')
            } else {
                t.ok(false, 'Got unexpected message on debug channel.')
            }
        })

        log.info.on('data', function (data) {
            var data = JSON.parse(data)
            if (data.message == 'Info') {
                t.ok(true, 'Got expected message on info channel.')
                t.ok(data.additional, 'Got expected extra property on info channel.')
            } else {
                t.ok(false, 'Got unexpected message on info channel.')
                t.ok(data.additional, 'Got expected extra property on info channel.')
            }
        })

        log.warn.on('data', function (data) {
            var data = JSON.parse(data)
            if (data.message == 'Warn') {
                t.ok(true, 'Got expected message on warn channel.')
            } else {
                t.ok(false, 'Got unexpected message on warn channel.')
            }
        })

        log.error.on('data', function (data) {
            var data = JSON.parse(data)
            if (data.message == 'Error') {
                t.ok(true, 'Got expected message on error channel.')
            } else {
                t.ok(false, 'Got unexpected message on error channel.')
            }
        })

        log.fatal.on('data', function (data) {
            var data = JSON.parse(data)
            if (data.message == 'Fatal') {
                t.ok(true, 'Got expected message on fatal channel.')
            } else {
                t.ok(false, 'Got unexpected message on fatal channel.')
            }
        })
    })
    
    process.nextTick(function () {
        log.debug('Debug')
        log('Info', {additional:true}) // This is default channel
        log.warn('Warn')
        log.error('Error')
        log.fatal('Fatal')
    })

    t.end()
})