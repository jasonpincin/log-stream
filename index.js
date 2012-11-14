var util            = require('util')
,   es              = require('event-stream')

var LogStream
module.exports = LogStream = function (options) {

    var options = options || {}

    var levels          = options.levels || ['debug','info','warn','error','fatal']
    ,   defaultLevel    = options.defaultLevel || 'info'
    ,   realm           = options.realm || null
    ,   globalData      = options.data || {}

    var logger = function () {
        logger[defaultLevel].apply(logger[defaultLevel], arguments)
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
    logger.createStream = function() {
        var levels = [].slice.apply(arguments)
        var stream = es.through(function write(data) {
            this.emit('data', data)
        })
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

        return stream
    }

    var LogStreamLevel = function (level) {

        var recorder = function () {
            var args = [].slice.apply(arguments)
            if (typeof args[args.length-1] == 'object')
                var _data = args.pop()
            else
                var _data = {}

            var message = util.format.apply(util, args)
            var entry  = {time: new Date, realm: realm, level:level, message:message, data:globalData}
            for (p in _data)
                entry.data[p] = _data[p]
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
