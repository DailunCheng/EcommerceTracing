/* eslint-env browser */
var os = require( 'os' );
var networkInterfaces = os.networkInterfaces( );
var ip = "128.253.128.66"
const {
  BatchRecorder,
} = require('zipkin');
const {HttpLogger} = require('zipkin-transport-http');

// Send spans to Zipkin asynchronously over HTTP
const zipkinBaseUrl = 'http://'+ip+':9411';
const recorder = new BatchRecorder({
  logger: new HttpLogger({
    endpoint: `${zipkinBaseUrl}/api/v1/spans`,
  })
});

module.exports.recorder = recorder;
