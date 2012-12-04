var util            = require('util')
,   es              = require('event-stream')
,   hostname        = require('os').hostname()

var LogStream
module.exports = LogStream = function (options) {

    var options = options || {}

    var levels          = options.levels || ['debug','info','warn','error','fatal']
    ,   defaultLevel    = options.defaultLevel || 'info'
    ,   localNS         = options.ns || generateNS()
    ,   globalData      = options.data || {}

    var logger = function () {
        logger[defaultLevel].apply(logger[defaultLevel], arguments)
    }
    logger.stream = es.pipeline(
        es.through(function write (data) {
            var lm = JSON.parse(data)
            if (lm.ns != localNS) {
                if (logger[lm.level]) {
                    logger[lm.level].stream.write(data)
                }
                else {
                    lm.ns = localNS
                    lm.nsPath.unshift(localNS)
                    this.emit('data', JSON.stringify(lm))
                }
            }
            else {
                this.emit('data', data)            
            }
        }),
        es.pause()
    )
    logger.stream.setMaxListeners(Infinity)

    logger.connect = function (pl) {
        logger.stream.pipe(pl.stream)
        return logger
    }

    logger.createStream = function() {
        var levels = [].slice.apply(arguments)
        var stream = es.pause() 
        logger.pipe(es.pipeline(
              es.parse()
            , es.map(function (data, cb) {
                if (levels.indexOf(data.level) >= 0)
                    cb(null, data)
                else
                    cb()
            })
            , es.stringify()
        )).pipe(stream)

        stream.setMaxListeners(Infinity)
        return stream
    }
    logger.textPipeline = es.pipeline(
        es.parse(),
        es.map(function (data,cb) {
            data.time = new Date(data.time)
            cb(null, util.format('%s%s %s\n',
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
                data.message
            ))
        })
    )

    logger.errorHandler = function (level, msg) {
        if (arguments.length == 1 && !(level in logger))
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
            if (typeof args[args.length-1] == 'object')
                var _data = args.pop()
            else
                var _data = {}

            var message = util.format.apply(util, args)
            var entry  = {time: new Date, hostname: hostname, ns: localNS, nsPath: [], level:level, message:message, data:globalData}
            for (p in _data)
                entry.data[p] = _data[p]
            recorder.stream.write( JSON.stringify(entry) )
        }
        recorder.stream = es.pipeline(
              es.parse()
            , es.map(function (data, cb) {
                data.ns = localNS
                data.nsPath.unshift(localNS)
                cb(null, data)
            })
            , es.stringify()
            , es.pause()
        )
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

function generateNS( ) {
    var ns = Math
        .floor(Math.random() * 1000000)
        .toString(36)
        .toUpperCase() 
    + (new Date)
        .getTime()
        .toString(36)
        .toUpperCase()
    return ns
}