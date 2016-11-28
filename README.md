# cloud-log
A web-based logging service

## Installing a Server
Download or clone the repository. Then inside the folder:
```
    npm install
```
Get google authentication clientID and clientSecret and replace them in config.sample.js and rename the file to config.js. Also set the server url to the url of your server.

You can also use a running server on cloudlog.me.

## Running the Server
```
    node index.js
```

## Connecting an App to a Server
First login and then generate admin and app tokens.
Then in your app directory:
```
    npm install cloudlog
```
And in your code:
```
    var console = require('cloudlog')('<your app token>')
    console.log('This is a log')
```
To see your logs on the server's page login and press the connect button in front of your tokens. Then use your browser's console to see the logs. 
