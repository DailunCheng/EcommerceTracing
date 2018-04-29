(function (){
  'use strict';

  var express   = require("express")
    , request   = require("request")
    , endpoints = require("../endpoints")
    , helpers   = require("../../helpers")
    , app       = express()

    const CLSContext = require('zipkin-context-cls');
    const {Tracer} = require('zipkin');
    const {recorder} = require('../../traceRecorder');
    const rest = require('rest');
    const {restInterceptor} = require('zipkin-instrumentation-cujojs-rest');
    const defaultRequest = require('rest/interceptor/defaultRequest');
    //const {expressMiddleware, wrapExpressHttpProxy} = require('zipkin-instrumentation-express')
    //const proxy = require('express-http-proxy');

    const ctxImpl = new CLSContext();
    const tracer = new Tracer({ctxImpl, recorder});

  app.get("/catalogue/images*", function (req, res, next) {
    
    //var zipkinRest =  rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_catalogue_getImages'});

    var url = endpoints.catalogueUrl + req.url.toString();
    /*
    zipkinRest({method:'GET',path:url}).then(
        function(response){
        res = response.entity;
        console.log("u");

})*/
       //.on('error', function(e) { next(e); console.log(e);})

    
    request.get(url)
        .on('error', function(e) { next(e); })
        .pipe(res);
  });

  app.get("/catalogue*", function (req, res, next) {
    helpers.simpleHttpRequest(endpoints.catalogueUrl + req.url.toString(), res, next);
  });

  app.get("/tags", function(req, res, next) {
    helpers.simpleHttpRequest(endpoints.tagsUrl, res, next);
  });

  module.exports = app;
}());
