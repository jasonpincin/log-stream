var util            = require('util')
,   es              = require('event-stream')

var LogStream
module.exports = LogStream = function (options) {

    var options = options || {}

    var levels          = options.levels || ['debug','info','warn','error','fatal']
    ,   defaultLevel    = options.defaultLevel || 'info'
    ,   realm           = options.realm || null
    ,   extra           = options.extra || {}

    var logger = function (message, _extra) {
        logger[defaultLevel](message, _extra)
    }
    logger.stream = es.through(function write (data) {
        this.emit('data', data)
    })
    logger.pipe = function () {
        return logger.stream.pipe.apply(logger.stream, arguments)
    }
    logger.on = function () {
        return logger.stream.on.apply(logger.stream, arguments)
    }

    var LogStreamLevel = function (level) {

        var recorder = function (message, _extra) {
            var _extra = _extra || {}
            ,   entry  = {time: new Date, realm: realm, level:level, message:message}
            for (p in extra)
                entry[p] = extra[p]
            for (p in _extra)
                entry[p] = _extra[p]
            recorder.stream.write( JSON.stringify(entry) )
        }
        recorder.stream = es.pipeline(
              es.parse()
            , es.map(function (data, cb) {
                data.realm = realm
                cb(null, data)
            })
            , es.stringify()
        )
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
