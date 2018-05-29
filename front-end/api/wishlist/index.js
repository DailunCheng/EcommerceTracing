(function (){
  'use strict';

  var async     = require("async")
    , express   = require("express")
    , request   = require("request")
    , helpers   = require("../../helpers")
    , endpoints = require("../endpoints")
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

  // List items in wishlist for current logged in user.
  app.get("/wishlist", function (req, res, next) {
     var zipkinRest =  rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_wishlist_get'});

    console.log("Request received: " + req.url + ", " + req.query.custId);
    var custId = helpers.getCustomerId(req, app.get("env"));
    console.log("Customer ID: " + custId);

     var url = endpoints.wishlistsUrl + "/" + custId + "/items";
     zipkinRest({method:'GET',path:url})
     .then(
         function(response){
            var body = "";
            if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
            if (typeof body.error !== "undefined" ) {
                return next(body.error);
            }
            helpers.respondStatusBody(res, response.status.code, JSON.stringify(body));
        }.bind({
                 res: res
             }))
     .catch(err => console.error('Error', err.stack))

    /*
    request(endpoints.wishlistsUrl + "/" + custId + "/items", function (error, response, body) {
      if (error) {
        return next(error);
      }
      helpers.respondStatusBody(res, response.statusCode, body)
    });*/
  });

  // Delete wishlist
  app.delete("/wishlist", function (req, res, next) {
     var zipkinRest =  rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_wishlist_delete_customer'});

    var custId = helpers.getCustomerId(req, app.get("env"));
    console.log('Attempting to delete wishlist for user: ' + custId);
    /*
    var options = {
      uri: endpoints.wishlistsUrl + "/" + custId,
      method: 'DELETE'
    };*/

     var url = endpoints.wishlistsUrl + "/" + custId;
     zipkinRest({method:'DELETE',path:url})
     .then(
         function(response){
            var body = "";
            if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
            if (typeof body.error !== "undefined" ) {
                return next(body.error);
            }
            console.log('User wishlist deleted with status: ' + response.status.code);
            helpers.respondStatus(res, response.status.code);
        }.bind({
                 res: res
             }))
     .catch(err => console.error('Error', err.stack))
    /*
    request(options, function (error, response, body) {
      if (error) {
        return next(error);
      }
      console.log('User wishlist deleted with status: ' + response.statusCode);
      helpers.respondStatus(res, response.statusCode);
    });*/
  });

  // Delete item from wishlist
  app.delete("/wishlist/:id", function (req, res, next) {
    var zipkinRest =  rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_wishlist_delete_item'});

    if (req.params.id == null) {
      return next(new Error("Must pass id of item to delete"), 400);
    }

    console.log("Delete item from wishlist: " + req.url);

    var custId = helpers.getCustomerId(req, app.get("env"));
    /*
    var options = {
      uri: endpoints.wishlistsUrl + "/" + custId + "/items/" + req.params.id.toString(),
      method: 'DELETE'
    };*/

     var url = endpoints.wishlistsUrl + "/" + custId + "/items/" + req.params.id.toString();
     zipkinRest({method:'DELETE',path:url})
     .then(
         function(response){
            var body = "";
            if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
            if (typeof body.error !== "undefined" ) {
                return next(body.error);
            }
            console.log('Item deleted with status: ' + response.status.code);
            helpers.respondStatus(res, response.status.code);
        }.bind({
                 res: res
             }))
     .catch(err => console.error('Error', err.stack))

    /*
    request(options, function (error, response, body) {
      if (error) {
        return next(error);
      }
      console.log('Item deleted with status: ' + response.statusCode);
      helpers.respondStatus(res, response.statusCode);
    });*/
  });

  // Add new item to wishlist
  app.post("/wishlist", function (req, res, next) {
     var zipkinRestCatalogue= rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_wishlist_catalogue_get'});
     var zipkinRestWithWishlist =  rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_wishlist_post'});

    console.log("Attempting to add to wishlist: " + JSON.stringify(req.body));

    if (req.body.id == null) {
      next(new Error("Must pass id of item to add"), 400);
      return;
    }

    var custId = helpers.getCustomerId(req, app.get("env"));

    async.waterfall([
      function(callback){
         var urlCatalogue = endpoints.catalogueUrl + "/catalogue/" + req.body.id.toString();
         zipkinRestCatalogue({method:'GET',path:urlCatalogue})
         .then(
              function(response){
                   var body = "";
                   if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
                   console.log(JSON.stringify(body));
                   callback(body.error, body);})
         .catch(err => console.error('Error', err.stack))

        /*
        function (callback) {
          request(endpoints.catalogueUrl + "/catalogue/" + req.body.id.toString(), function (error, response, body) {
            console.log(body);
            callback(error, JSON.parse(body));
          });*/
        },
        function (item, callback) {
          /*
          var options = {
            uri: endpoints.wishlistsUrl + "/" + custId + "/items",
            method: 'POST',
            json: true,
            body: {itemId: item.id, unitPrice: item.price}
          };
          console.log("POST to wishlists: " + options.uri + " body: " + JSON.stringify(options.body));*/
           var option_body = {itemId: item.id, unitPrice: item.price};
           var urlWishlist = endpoints.wishlistsUrl + "/" + custId + "/items";

           console.log("POST to wishlists: " + urlWishlist + " body: " + JSON.stringify(option_body));

           zipkinRestWithWishlist({method:'POST',path:urlWishlist,entity:JSON.stringify(option_body),headers: {'Content-Type': 'application/json'}})
           .then(
               function(response){
                    var body = "";
                        if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
                        if (typeof body.error !== "undefined" ) {
                             callback(body.error);
                             return;
                        }
                    callback(null, response.status.code);
               })
           .catch(err => console.error('Error', err.stack))


          /*
          request(options, function (error, response, body) {
            if (error) {
              callback(error)
                return;
            }
            callback(null, response.statusCode);
          });*/
        }
    ], function (err, statusCode) {
      if (err) {
        return next(err);
      }
      if (statusCode != 201) {
        return next(new Error("Unable to add to wishlist. Status code: " + statusCode))
      }
      helpers.respondStatus(res, statusCode);
    });
  });

// Update wishlist item
  app.post("/wishlist/update", function (req, res, next) {
     var zipkinRestCatalogue= rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_wishlist_catalogue_get'});
     var zipkinRestWithWishlist =  rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_wishlist_update'});


    console.log("Attempting to update wishlist item: " + JSON.stringify(req.body));

    if (req.body.id == null) {
      next(new Error("Must pass id of item to update"), 400);
      return;
    }
    if (req.body.quantity == null) {
      next(new Error("Must pass quantity to update"), 400);
      return;
    }
    var custId = helpers.getCustomerId(req, app.get("env"));

    async.waterfall([
      function(callback){
         var urlCatalogue = endpoints.catalogueUrl + "/catalogue/" + req.body.id.toString();
         zipkinRestCatalogue({method:'GET',path:urlCatalogue})
         .then(
              function(response){
                   var body = "";
                   if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
                   console.log(JSON.stringify(body));
                   callback(body.error, body);})
         .catch(err => console.error('Error', err.stack))

        /*
        function (callback) {
          request(endpoints.catalogueUrl + "/catalogue/" + req.body.id.toString(), function (error, response, body) {
            console.log(body);
            callback(error, JSON.parse(body));
          });*/
        },
        function (item, callback) {
          /*
          var options = {
            uri: endpoints.wishlistsUrl + "/" + custId + "/items",
            method: 'PATCH',
            json: true,
            body: {itemId: item.id, quantity: parseInt(req.body.quantity), unitPrice: item.price}
          };
          console.log("PATCH to wishlists: " + options.uri + " body: " + JSON.stringify(options.body));
          */
           var option_body = {itemId: item.id, quantity: parseInt(req.body.quantity), unitPrice: item.price};
           var urlWishlist = endpoints.wishlistsUrl + "/" + custId + "/items";
           console.log("PATCH to wishlists: " + urlWishlist + " body: " + JSON.stringify(option_body));

           zipkinRestWithWishlist({method:'PATCH',path:urlWishlist,entity:JSON.stringify(option_body),headers: {'Content-Type': 'application/json'}})
           .then(
               function(response){
                  var body = "";
                 if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
                 if (typeof body.error !== "undefined" ) {
                     callback(body.error);
                     return;
                  }
                  callback(null, response.status.code);
           })
           .catch(err => console.error('Error', err.stack))

          /*
          request(options, function (error, response, body) {
            if (error) {
              callback(error)
                return;
            }
            callback(null, response.statusCode);
          });*/
        }
    ], function (err, statusCode) {
      if (err) {
        return next(err);
      }
      if (statusCode != 202) {
        return next(new Error("Unable to add to wishlist. Status code: " + statusCode))
      }
      helpers.respondStatus(res, statusCode);
    });
  });

  module.exports = app;
}());
