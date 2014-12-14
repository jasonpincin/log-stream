# log-stream

[![NPM version](https://badge.fury.io/js/log-stream.png)](http://badge.fury.io/js/log-stream)
[![Build Status](https://travis-ci.org/jasonpincin/log-stream.svg?branch=master)](https://travis-ci.org/jasonpincin/log-stream)
[![Coverage Status](https://coveralls.io/repos/jasonpincin/log-stream/badge.png?branch=master)](https://coveralls.io/r/jasonpincin/log-stream?branch=master)
[![Davis Dependency Status](https://david-dm.org/jasonpincin/log-stream.png)](https://david-dm.org/jasonpincin/log-stream)

Very simple take on logging. This package doesn't concern itself with transports, 
persistence, or anything of the sort.  Instead, it exposes streams which you can 
.pipe() around as you see fit.

## installing

``` js
npm install --save log-stream
```

## usage

``` js
var log = require('log-stream')({name: 'myApp'})
log.stream.pipe(process.stdout)

log('The sky is falling!')
log.fatal('This message should be %s.', 'fatal') 
```

## options

LogStream accepts the following options.

- `name`: required - Will be included in message as `name`.
- `levels`: default `{ trace': 10, 'debug': 20,'info': 30,'warn': 40,'error': 50,'fatal': 60 }` - An array of logging levels to expose.
- `defaultLevel`: default `"info"` - When using `log(message)` instead of explicitly specifying the level, this option specifies which 
  level the message is sent to.


## api

### log = require('log-stream')([options])

### log([data], message [, arg1, arg2, ...])

- `data`: An optional object containing properties/values that will be passed as part of the log entry.
- `message`: A string containing the message to be logged. Messages support `util.format` style 
formatting, and any argument after the message will be substituted into the message in the same manner 
as `util.format`. The data argument is expected to be last. 

### log.level([data], message [, arg1, arg2, ...])

Options are the same as above, but the level is explicitly stated instead of allowing the message to 
go to the default log level. (ex: log.error('This is an error message') )

### log.errorHandler([level, msg])

`log.errorHandler` will generate a function that can be supplied as a callback to a function honoring 
the error-first callback convention. If that function executes the generated callback with an error, 
then a log message will be recorded. If a level is provided, it will be used, otherwise `error` will be 
used. If a `msg` is provided, it will be the log message, otherwise the error's `message` property will 
be the message (or the string passed as 1st argument if Error object is not used). If the 1st argument 
is an `Error` object, it will be serialized and passed as part of the log message in the `err` property.

### log.level([data], message [, arg1, arg2, ...]).andCallWithError(cb)

Often you may want to log an error, and execute an error-first style callback with the error you just 
logged. The log-stream module makes this easier by returning an object on log calls that exposes the 
`andCallWithError` function which accepts a callback. The callback will be executed and 
passed an Error() object as the 1st argument. This error object will expose: `message`, and `log` 
properties where log contains all the log properties.

### log.stream 

The stream property of the log instance is a duplex stream. It will emit all log entries recorded to any 
log level within the log instance, and writes to it will be re-emitted. Writes should adhere to the 
protocol described below.

### log[level]stream 

The stream property of each log level is a duplex stream. It will emit log entries recorded to that log 
level, and writes to it will be emitted to itself, and the root log stream. Writes should adhere to the 
protocol described below.

### log.createStream(...)

`log.createStream` is used to create a filtered stream of selected level and above only, useful for outputting and 
persisting. 

## examples

Example that displays only errors and fatals to the console: 

``` js
var log = require('log-stream')({prefix:'custom-example'})

log.createStream('error').pipe(process.stderr)
log.info('This will not appear on stderr.')
log.error('But this will.')
``` 

Here we log an error in a function and stop execution, supplying error to callback.

``` js
function doSomething (cb) {
    // Do something
    if (err) return log.error('An error occured.').andCallWithError(cb)
}

// Here's another way of doing the same thing, perhaps a little less readable
function doSomething (cb) {
    // Do something
    if (err) return cb( log.error('An error occured.').errorObject )
}
```

## persistence

To persist log messages, simply pipe the log.stream to a persistent writable stream.

## protocol

Log entries are streamed in this format:

``` js
{"name":"myApp","hostname":"localhost","pid":55455,"level":30,"msg":"The sky is falling!","time":"2014-12-05T05:08:44.016Z","v":1}
```

`time` is automatically set at the time the event is recorded from Date.toISOString().

`hostname` contains the hostname of the node process that the log message originated from, as output from 
`os.hostname()`

`name` will be the string specified when the logger was created.

`level` will contain the numeric level in which the message was recorded.

`message` contains the message recorded. 

If any `data` properties were passed as part of the message, they will be present in the JSON chunk as well.

### example

``` js
var log = require('log-stream')({name:"App"})

log.stream.pipe(process.stdout)
log.debug("stream all the things", {why:"because"})
```

results in a stream chunk like:

``` js
{"name":"myApp","hostname":"localhost","pid":55736,"level":20,"msg":"stream all the things","time":"2014-12-05T05:12:08.814Z","v":1,"why":"because"}
```

## testing

`npm test [--dot | --spec] [--coverage]`

### options

* `--dot` - output test results as dots instead of tap
* `--spec` - output test results as spec instead of tap
* `--coverage` - display text cover report
  

### patterns

Only run test files matching a certain pattern by prefixing the 
test command with `grep=pattern`. Example:

```
grep=connect npm test --dot
```

### html coverage report

Open it with `npm run view-cover` or `npm run vc`
