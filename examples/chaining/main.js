var LogStream   = require('../../index.js')
,   component   = require('./component.js')
,   log         = LogStream({ns:'main'})

component.log.stream.pipe(log.stream)
log.stream.pipe(process.stdout)

log.info('Hello from main.')
component.doSomething()
