# log-stream

Very simple take on stream-based logging. This package doesn't concern itself with 
transports, persistence, or anything of the sort found in most logging libraries. 
Instead, it exposes streams which you can .pipe() around as you see fit.

## Installing

``` js
npm install log-stream
```

## Usage

``` js
var options = {defaultLevel:'info', prefix:'simple-app'}
,   log 
(log = require('log-stream')(options) )
    .stream.pipe(process.stdout)


log('The sky is falling!')
log.fatal('The last message should have been %s.', 'fatal') 
```

## Options

LogStream accepts the following options.

- `levels`: default `["debug","info","audit",warn","error","fatal"]` - An array of logging levels to expose.
- `defaultLevel`: default `"info"` - When using log(message) instead of explicitly specifying the level 
[ ex: log.info(message) ], this option specifies which level the message is sent to.
- `prefix`: default `null` - Will be included in message as `prefix`, and will be included in text output before message.
- `data`: default `{}` - Extra properties/values that are passed with all entries written to this 
LogStream instance.


## API

### log(message [, arg1, arg2, ..., data])

- `message`: A string containing the message to be logged. Messages support `util.format` style 
formatting, and any argument after the message will be substituted into the message in the same manner 
as `util.format`. The data argument is expected to be last. 
- `data`: An object containing properties/values that will be passed with the log entry.

### log.level(message [[, arg1, arg2, ..., data])

Options are the same as above, but the level is explicitly stated instead of allowing the message to 
go to the default log level. (ex: log.error('This is an error message') )

### log.stream 

The stream property of the log instance is a duplex stream. It will emit all log entries recorded to any 
log level within the log instance, and writes to it will be re-emitted. Writes should adhere to the 
protocol described below.

### log.level.stream 

The stream property of each log level is a duplex stream. It will emit log entries recorded to that log 
level, and writes to it will be emitted to itself, and the root log stream. Writes should adhere to the 
protocol described below.

### log.createStream(...)

`log.createStream` is used to create a filtered stream of selected levels only, useful for outputting and 
persisting. 

Example that displays only errors and fatals to the console: 

``` js
var log = require('log-stream')({prefix:'custom-example'})

log.createStream('error','fatal').pipe(process.stdout)
log.info('This will not appear on the console.')
log.error('But this will.')
``` 

You may also specify a single integer with `log.createStream` to include all log levels starting at the 
index specified.

``` js
var log = require('log-stream')({prefix:'custom-example', levels:['debug','error','fatal']})

log.createStream(1).pipe(process.stdout)
log.debug('This will not appear on the console.')
log.error('But this will.')
```

## Chaining

LogStream supports chaining loggers via events. This is useful when a required component being used 
provides a log-stream interface, and you would like to include it's output in your program's own LogStream 
output. 

Chaining Example:

main.js

``` js
var log         = require('log-stream')({prefix:'main'})
,   component   = require('./component')

component.on('log', log)
log.stream.pipe(process.stdout)

log.info('Hello from main.')
component.doSomething()
```

component.js

``` js
var log         = require('log-stream')({prefix:'component'})
,   EventStream = require('events').EventStream
,   util        = require('util')

function Something () {
    log.on('log', this.emit.bind(this, 'log'))
}
util.inherits(Something, EventStream)
Something.prototype.doSomething = function () {
    log.warn('The component tried to do something.')
}

module.exports = Something
```

Running `node main.js` will result in the following output:

``` js
{"time":"...","prefix":"main","level":"info","message":"Hello from main.","data":{}}
{"time":"...","prefix":"main","level":"warn","message":"The component tried to do something.","data":{}}
```

As you can see, logs can be connected easily by emitting the log events of one to the other.

## Text

To pipe textual output instead of JSON, you can use the built in text stream. 

``` js
log.text.pipe(console.stdout)
```

## Persistence

To persist log messages, simply pipe the log.stream to a persistent writable stream.

## Protocol

Log entries are streamed in this format:

``` js
{"time":"2012-11-14T15:17:59.108Z","hostname":"host1","prefix":"local","level":"info","message":"The sky is falling!","data":{}}
```

`time` is automatically set at the time the event is recorded. 

`hostname` contains the hostname of the node process that the log message originated from, as output from 
`os.hostname()`

`prefix` will be a string or null.

`level` will contain the level in which the message was recorded.

`message` contains the message recorded. 

If any `data` properties were provided to the logger at the time it was instantiated, or passed 
as part of the message, they will be present in the JSON chunk, within the data property.

### Example

``` js
var log = require('log-stream')({prefix:"App"})

log.stream.pipe(process.stdout)
log.debug("Streams rock.", {whosaidit:"Jason"})
```

results in this stream chunk:

``` js
{"time":"2012-11-14T15:17:59.108Z","hostname":"host1","prefix":"App",level":"debug","message":"Streams rock.","data":{"whosaidit":"Jason"}}
```
