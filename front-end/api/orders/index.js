(function (){
  'use strict';

  var async     = require("async")
    , express   = require("express")
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

    const zipkinMiddleware = require('zipkin-instrumentation-express').expressMiddleware;
    app.use(zipkinMiddleware({tracer:tracer,serviceName:'frontend'}));


    var util = require('util');

  app.get("/orders", function (req, res, next) {
    var zipkinRest =  rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_order_get'});

    console.log("Request received with body: " + JSON.stringify(req.body));
    var logged_in = req.cookies.logged_in;
    if (!logged_in) {
      throw new Error("User not logged in.");
      return
    }

    var custId = req.session.customerId;
    async.waterfall([
        function (callback) {
          var url = endpoints.ordersUrl + "/orders/search/customerId?sort=date&custId=" + custId;
          zipkinRest({method:'GET',path:url})
          .then(
              function(response){
                  var body = "";
                  if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
                  if (typeof body.error !== "undefined" ) {
                      return callback(body.error);
                  }
                  console.log("Received response: " + JSON.stringify(body));
                  if (response.status.code == 404) {
                      console.log("No orders found for user: " + custId);
                      return callback(null, []);
                  }
                  callback(null, body._embedded.customerOrders);
          })
          .catch(err => console.error('Error', err.stack))
          /*
          request(endpoints.ordersUrl + "/orders/search/customerId?sort=date&custId=" + custId, function (error, response, body) {
            if (error) {
              return callback(error);
            }
            console.log("Received response: " + JSON.stringify(body));
            if (response.statusCode == 404) {
              console.log("No orders found for user: " + custId);
              return callback(null, []);
            }
            callback(null, JSON.parse(body)._embedded.customerOrders);
          });*/
        }
    ],
    function (err, result) {
      if (err) {
        return next(err);
      }
      helpers.respondStatusBody(res, 201, JSON.stringify(result));
    });
  });

  app.get("/orders/*", function (req, res, next) {
    var url = endpoints.ordersUrl + req.url.toString();
    request.get(url).pipe(res);
  });

  app.post("/orders", function(req, res, next) {
    var zipkinRestCustomer =  rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_order_customers_get'});
    var zipkinRestCard =  rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_order_card_get'});
    var zipkinRestAddress =  rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_order_address_get'});
    var orderHeader = rest.wrap(defaultRequest, { headers: {'json':'true'} });
    var zipkinRestWithOrder =  orderHeader.wrap(restInterceptor, {tracer, serviceName: 'frontend_order_post'});


    console.log("Request received with body: " + JSON.stringify(req.body));
    var logged_in = req.cookies.logged_in;
    if (!logged_in) {
      throw new Error("User not logged in.");
      return
    }

    var custId = req.session.customerId;

    async.waterfall([
        function (callback) {
        var urlGetCustomer=endpoints.customersUrl + '/' + custId;
        zipkinRestCustomer({method:'GET',path:urlGetCustomer})
        .then(
            function(response){
                var body = "";
                if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
                if (typeof body.error !== "undefined" || response.status.code === 500) {
                    callback(error);
                    return;
                }
                console.log("Received response: " + JSON.stringify(body));
                var jsonBody = body;
                var customerlink = jsonBody._links.customer.href;
                var addressLink = jsonBody._links.addresses.href;
                var cardLink = jsonBody._links.cards.href;
                var order = {
                  "customer": customerlink,
                  "address": null,
                  "card": null,
                  "items": endpoints.cartsUrl + "/" + custId + "/items"
                };
                callback(null, order, addressLink, cardLink);
            })
        .catch(err => console.error('Error', err.stack))



         /*
          request(endpoints.customersUrl + "/" + custId, function (error, response, body) {
            if (error || body.status_code === 500) {
              callback(error);
              return;
            }
            console.log("Received response: " + JSON.stringify(body));
            var jsonBody = JSON.parse(body);
            var customerlink = jsonBody._links.customer.href;
            var addressLink = jsonBody._links.addresses.href;
            var cardLink = jsonBody._links.cards.href;
            var order = {
              "customer": customerlink,
              "address": null,
              "card": null,
              "items": endpoints.cartsUrl + "/" + custId + "/items"
            };
            callback(null, order, addressLink, cardLink);
          });*/
        },
        function (order, addressLink, cardLink, callback) {
          async.parallel([
              function (callback) {
                console.log("GET Request to: " + addressLink);

                var urlAddress=addressLink;
                zipkinRestAddress({method:'GET',path:urlAddress})
                .then(
                    function(response){
                        var body = "";
                        if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
                        if (typeof body.error !== "undefined" ) {
                             return callback(body.error);
                        }
                        console.log("Received response: " + JSON.stringify(body));
                        var jsonBody = body;
                        if (response.status.code !== 500 && jsonBody._embedded.address[0] != null) {
                          order.address = jsonBody._embedded.address[0]._links.self.href;
                        }
                        callback();
                    })
                .catch(err => console.error('Error', err.stack))

                /*
                request.get(addressLink, function (error, response, body) {
                  if (error) {
                    callback(error);
                    return;
                  }
                  console.log("Received response: " + JSON.stringify(body));
                  var jsonBody = JSON.parse(body);
                  if (jsonBody.status_code !== 500 && jsonBody._embedded.address[0] != null) {
                    order.address = jsonBody._embedded.address[0]._links.self.href;
                  }
                  callback();
                });*/
              },
              function (callback) {
                console.log("GET Request to: " + cardLink);

                var urlCard=cardLink;
                zipkinRestCard({method:'GET',path:urlCard})
                .then(
                    function(response){
                        var body = "";
                        if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
                        if (typeof body.error !== "undefined" ) {
                             return callback(body.error);
                        }
                        console.log("Received response: " + JSON.stringify(body));
                        var jsonBody = body;
                        if (response.status.code !== 500 && jsonBody._embedded.card[0] != null) {
                            order.card = jsonBody._embedded.card[0]._links.self.href;
                        }
                        callback();
                    })
                .catch(err => console.error('Error', err.stack))

                /*
                request.get(cardLink, function (error, response, body) {
                  if (error) {
                    callback(error);
                    return;
                  }
                  console.log("Received response: " + JSON.stringify(body));
                  var jsonBody = JSON.parse(body);
                  if (jsonBody.status_code !== 500 && jsonBody._embedded.card[0] != null) {
                    order.card = jsonBody._embedded.card[0]._links.self.href;
                  }
                  callback();
                });*/
              }
          ], function (err, result) {
            if (err) {
              callback(err);
              return;
            }
            console.log(err);
            console.log(result);
            callback(null, order);
          });
        },
        function (order, callback) {

          var options = {
            uri: endpoints.ordersUrl + '/orders',
            method: 'POST',
            json: true,
            body: order
          };
          console.log("Posting Order: " + JSON.stringify(order));
          //having 'Conflicting setter definitions for property \"items\": works.weave.socks.orders.entities.CustomerOrder#setItems' error status 415
          /*
          var urlPost = endpoints.ordersUrl + '/orders';
          zipkinRestWithOrder({method:'POST',path:urlPost,entity:JSON.stringify(order)})
          .then(
              function(response){
                console.log(util.inspect(response));
                var body = "";
                if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
                if (typeof body.error !== "undefined" ) {
                    return callback(body.error);
                }
                console.log("Order response: " + response);
                console.log("Order response: " + JSON.stringify(body));
                callback(null, response.status.code, body);
              })
          .catch(err => console.error('Error', err.stack))
          */

          request(options, function (error, response, body) {
            if (error) {
              return callback(error);
            }
            console.log("Order response: " + JSON.stringify(response));
            console.log("Order response: " + JSON.stringify(body));
            callback(null, response.statusCode, body);
          });
        }
    ],
    function (err, status, result) {
      if (err) {
        return next(err);
      }
      helpers.respondStatusBody(res, status, JSON.stringify(result));
    });
  });

  module.exports = app;
}());
