var LogStream   = require('../../index.js')
,   log         = LogStream({ns:'component'})

module.exports = {
    log: log,
    doSomething: function () {
        log.warn('The component tried to do something.')
    }
}
