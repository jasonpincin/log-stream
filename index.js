var util            = require('util')
,   EventEmitter    = require('events').EventEmitter
,   pause           = require('pause-stream')
,   through         = require('through')
,   pipeline        = require('stream-combiner')
,   map             = require('map-stream')
,   hostname        = require('os').hostname()

var LogStream
module.exports = LogStream = function (options) {

    var options = options || {}

    var levels          = options.levels || ['debug','info','audit','warn','error','fatal']
    ,   defaultLevel    = options.defaultLevel || 'info'
    ,   logPrefix       = options.prefix || options.ns || null // Support ns for legacy reasons
    ,   globalData      = options.data || {}

    var createTextStream = function () {
        var textStream = map(function (data,cb) {
            if (!data) return cb()
                var data = JSON.parse(data)
            data.time = new Date(data.time)
            cb(null, util.format('%s%s%s%s %s %s\n',
                (
                    data.time.getFullYear()+'-'+
                        ( '0' + data.time.getMonth() ).substr(-2)+'-'+
                        ( '0' + data.time.getDate() ).substr(-2)+' '+
                        ( '0' + data.time.getHours() ).substr(-2)+':'+
                        ( '0' + data.time.getMinutes() ).substr(-2)+':'+
                        ( '0' + data.time.getSeconds() ).substr(-2)+'.'+
                        ( '00' + data.time.getMilliseconds() ).substr(-3)
                ), 
                data.hostname ? ' ' + data.hostname.split('.')[0] : '',
                logPrefix ? ' ' + logPrefix : '',
                data.logPrefix ? '/' + data.logPrefix : '',
                data.level,
                data.message
            ))
        })
        return textStream
    }

    var logger = function () {
        var args = [].slice.apply(arguments)
        if (levels.indexOf(args[0]) !== -1) {
            var lvl = args.shift()
            try {
                var ld = JSON.parse(args[0])
                if (logger[lvl])
                    logger[lvl].stream.write(args[0])
            }
            catch (err) {
                if (logger[lvl])
                    logger[lvl].apply(logger[lvl], args)
                else
                    throw new Error('Error in log-stream, attempting to use unknown level: ' + lvl)
            }
        } else {
            logger[defaultLevel].apply(logger[defaultLevel], arguments)
        }
    }

    logger.events = new EventEmitter()
    logger.on = logger.events.on.bind(logger.events)
    logger.emit = logger.events.emit.bind(logger.events)

    logger.stream = pipeline(
        through(function write (data) {
            this.emit('data', data)
            logger.text.write(data)
            logger.emit('log', JSON.parse(data).level, data)
        }),
        pause()
    )
    logger.stream.setMaxListeners(Infinity)

    logger.connect = function (pl) {
        logger.events.on('log', pl)
        return logger
    }

    logger.createStream = function() {
        var _levels = (arguments.length === 1 && typeof arguments[0] === 'number') ? levels.slice(arguments[0]) : [].slice.apply(arguments)
        var stream = pause() 
        logger.stream.pipe(map(function (data, cb) {
            if (_levels.indexOf(JSON.parse(data).level) >= 0)
                cb(null, data)
            else
                cb()
        })).pipe(stream)

        stream.setMaxListeners(Infinity)
        stream.text = createTextStream()
        stream.on('data', stream.text.write.bind(stream.text))
        return stream
    }
    logger.text = createTextStream()

    logger.errorHandler = function (level, msg) {
        if (arguments.length === 1 && !(level in logger))
            var msg = level, level = 'error'
        if (typeof level === 'undefined')
            var level = 'error'
        
        return function (err) {
            if (msg)
                logger[level](msg, err.message || err, {error: err})
            else
                logger[level](err.message || err, {error:err})
        }
    }

    var LogStreamLevel = function (level) {

        var recorder = function () {
            var args = [].slice.apply(arguments)
            if (typeof args[args.length-1] === 'object')
                var _data = args.pop()
            else
                var _data = {}

            var message = util.format.apply(util, args)
            var entry  = {time: new Date(), hostname: hostname, prefix: logPrefix, level:level, message:message, data:globalData}
            for (var p in _data)
                entry.data[p] = _data[p]
            recorder.stream.write( JSON.stringify(entry) )
        }
        recorder.stream = pause()
        recorder.stream.setMaxListeners(Infinity)

        recorder.pipe = function () {
            return recorder.stream.pipe.apply(recorder.stream, arguments)
        }
        recorder.on = function () {
            return recorder.stream.on.apply(recorder.stream, arguments)
        }

        return recorder
    }

    levels.forEach(function (l) { 
        logger[l] = LogStreamLevel(l)
        logger[l].stream.pipe(logger.stream)
    })

    return logger
}

