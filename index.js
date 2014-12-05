var util         = require('util'),
    assert       = require('assert'),
    EventEmitter = require('events').EventEmitter,
    pause        = require('pause-stream'),
    through      = require('through'),
    pipeline     = require('stream-combiner'),
    map          = require('map-stream'),
    hostname     = require('os').hostname(),
    pid          = process.pid

var logStream = module.exports = function (options) {

    assert(typeof options === 'object' && typeof options.name === 'string', 'log-stream requires a name option')

    var levels       = options.levels || { 'trace': 10, 'debug': 20,'info': 30,'warn': 40,'error': 50,'fatal': 60 },
        defaultLevel = options.defaultLevel || 'info',
        name         = options.name

    var levelNames   = Object.keys(levels)

    var logger = function () {
        var args = [].slice.apply(arguments)
        if (~levelNames.indexOf(args[0])) {
            var lvl = args.shift()
            logger[lvl].apply(logger[lvl], args)
        } else {
            logger[defaultLevel].apply(logger[defaultLevel], args)
        }
    }
    Object.getOwnPropertyNames(EventEmitter.prototype).forEach(function (prop) {
        logger[prop] = EventEmitter.prototype[prop]
    })
    EventEmitter.call(logger)

    logger.stream = pipeline(
        through(function write (data) {
            this.emit('data', data)
            logger.emit('log', JSON.parse(data).level, data)
        }),
        pause()
    )
    logger.stream.setMaxListeners(Infinity)

    logger.createStream = function(minLevel) {
        var stream = pause()
        logger.stream.pipe(map(function (data, cb) {
            if (JSON.parse(data).level >= levels[minLevel])
                cb(null, data)
            else
                cb()
        })).pipe(stream)

        stream.setMaxListeners(Infinity)
        return stream
    }

    logger.errorHandler = function (level, msg) {
        if (arguments.length === 1 && !(level in logger))
            msg = level, level = 'error'
        if (typeof level === 'undefined')
            level = 'error'

        return function (err) {
            if (!err) return
            var data = {}
            if (typeof err === 'object')
                data.err = {message: err.message, name: err.name, stack: err.stack}
            if (msg)
                logger[level](data, msg)
            else
                logger[level](data, err.message || err)
        }
    }

    var LogStreamLevel = function (level) {

        var recorder = function () {
            var _data, args = [].slice.apply(arguments)
            if (typeof args[0] === 'object')
                _data = args.shift()
            else
                _data = {}

            var message = util.format.apply(util, args)
            var entry  = { name: name, hostname: hostname, pid: pid, level: levels[level], msg: message, time: (new Date()).toISOString(), v:1 }
            for (var p in _data)
                entry[p] = _data[p]
            recorder.stream.write( JSON.stringify(entry) + '\n' )

            var errorObject = new Error(message)
            errorObject.log = entry

            return {
                errorObject: errorObject,
                andCallWithError: function andCallWithError (cb) {
                    cb(errorObject)
                }
            }
        }
        recorder.stream = pause()
        recorder.stream.setMaxListeners(Infinity)

        return recorder
    }

    levelNames.forEach(function (l) {
        logger[l] = LogStreamLevel(l)
        logger[l].stream.pipe(logger.stream)
    })

    return logger
}
