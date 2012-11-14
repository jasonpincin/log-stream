# Log Stream

Very simple take on stream-based logging. This package doesn't concern itself with 
transports, persistence, or anything of the sort found in most logging libraries. 
Instead, it exposes streams which you can .pipe() to the writable stream of your 
choice.

## Installing

``` js
npm install log-stream
```

## Usage

``` js
var options = {defaultLevel:'info'}
,   log 
(log = require('log-stream')(options) )
    .pipe(process.stdout)


log('The sky is falling!')
log.fatal('The last message should have been fatal.') 
```

## Options

Log Stream accepts the following options.

- `levels`: default `["debug","info","warn","error","fatal"]` - An array of logging levels to expose.
- `defaultLevel`: default `"info"` - When using log(message) instead of explicitly specifying the level 
[ ex: log.info(message) ], this option specifies which level the message is sent to.
- `realm`: default `null` - A realm can be attached to each logger. This realm is overridden when the 
stream is piped to another logger, by that logger's realm. 
- `data`: default `{}` - Extra properties/values that are passed with all entries written to this 
Log Stream instance.


## API

### log(message [, data])

- `message`: A string containing the message to be logged.
- `data`: An object containing properties/values that will be passed with the log entry.

### log.level(message [, data])

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

### .pipe() and .on() convenience methods

The `.pipe()` and `.on()` methods can be accessed via the log and log.[level] objects. They are simple wrappers 
for the associated `.stream.pipe()` and `.stream.on()` methods.

### log.createStream(...)

`log.createStream` is used to create a filtered stream of selected levels only, useful for outputting and 
persisting. 

Example that displays only errors and fatals to the console: 

``` js
var log = require('log-stream')()

log.createStream('error','fatal').pipe(process.stdout)
log.info('This will not appear on the console.')
log.error('But this will.')
``` 

## Protocol

Log entries are streamed in this format:

``` js
{"time":"2012-11-14T15:17:59.108Z","realm":null,"level":"info","message":"The sky is falling!","data":{}}
```

`time` is automatically set at the time the event is recorded. 

`realm` can be a string or null.

`level` will contain the level in which the message was recorded.

`message` contains the message recorded. 

If any `data` properties were provided to the logger at the time it was instantiated, or passed 
as part of the message, they will be present in the JSON chunk, within the data property.

### Example

``` js
var log = require('log-stream')({realm:"App"})

log.pipe(process.stdout)
log.debug("Streams rock.", {whosaidit:"Jason"})
```

results in this stream chunk:

``` js
{"time":"2012-11-14T15:17:59.108Z","realm":"App","level":"debug","message":"Streams rock.","data":{"whosaidit":"Jason"}}
```
