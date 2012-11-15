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
var options = {defaultLevel:'info', ns:'simple-app'}
,   log 
(log = require('log-stream')(options) )
    .stream.pipe(process.stdout)


log('The sky is falling!')
log.fatal('The last message should have been %s.', 'fatal') 
```

## Options

LogStream accepts the following options.

- `levels`: default `["debug","info","warn","error","fatal"]` - An array of logging levels to expose.
- `defaultLevel`: default `"info"` - When using log(message) instead of explicitly specifying the level 
[ ex: log.info(message) ], this option specifies which level the message is sent to.
- `ns`: default `random string` - A namespace can (should) be attached to each logger. This namespace is 
overridden when the stream is piped to another logger by that logger's namespace; however, the full 
namespace path is available as an array in the nsPath property of the log entry (see protocol below). The 
namespace is important for chaining log streams. LogStream expects the namespace of two LogStream 
instances being chained (see chaining below) via pipe to be different. To facilitate this, a random 
namespace will be generated if you do not provide one. Namespacing your logging components can help make 
more sense of your logging paths however, and is recommended.
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
var log = require('log-stream')({ns:'custom-example'})

log.createStream('error','fatal').pipe(process.stdout)
log.info('This will not appear on the console.')
log.error('But this will.')
``` 

## Chaining

LogStream supports chaining loggers via simple pipes. This is useful when a required component being used 
provides a log-stream interface, and you would like to include it's output in your program's own LogStream 
output. 

Chaining Example:

main.js

``` js
var LogStream   = require('log-stream')
,   component   = require('./component.js')
,   log         = LogStream({ns:'main'})

component.log.stream.pipe(log.stream)
log.stream.pipe(process.stdout)

log.info('Hello from main.')
component.doSomething()
```

component.js

``` js
var LogStream   = require('log-stream')
,   log         = LogStream({ns:'component'})

module.exports = {
    log: log,
    doSomething: function () {
        log.warn('The component tried to do something.')
    }
}
```

Running `node main.js` will result in the following output:

``` js
{"time":"...","ns":"main","nsPath":["main"],"level":"info","message":"Hello from main.","data":{}}
{"time":"...","ns":"main","nsPath":["main","component"],"level":"warn","message":"The component tried to do something.","data":{}}
```

When one LogStream instance is piped to another, the levels levels are piped as well. This means, in the example 
above, that the warning logged in component.js would also be emitted in the warning level of the LogStream 
instance of main.js. If a log message is recorded in a level that does not exist in the LogStream instance it is 
being piped to, it will only be emitted on the destination LogStream from the primary log.stream. 

## Persistence

To persist log messages, simply pipe the log.stream to a persistent writable stream.

## Protocol

Log entries are streamed in this format:

``` js
{"time":"2012-11-14T15:17:59.108Z","ns":"local-ns",nsPath:["local-ns"],"level":"info","message":"The sky is falling!","data":{}}
```

`time` is automatically set at the time the event is recorded. 

`ns` will be a string (assigned or random).

`nsPath` will contain an array of all namespaces the log message traversed (when chaining).

`level` will contain the level in which the message was recorded.

`message` contains the message recorded. 

If any `data` properties were provided to the logger at the time it was instantiated, or passed 
as part of the message, they will be present in the JSON chunk, within the data property.

### Example

``` js
var log = require('log-stream')({ns:"App"})

log.stream.pipe(process.stdout)
log.debug("Streams rock.", {whosaidit:"Jason"})
```

results in this stream chunk:

``` js
{"time":"2012-11-14T15:17:59.108Z","ns":"App","nsPath":["App"],level":"debug","message":"Streams rock.","data":{"whosaidit":"Jason"}}
```
