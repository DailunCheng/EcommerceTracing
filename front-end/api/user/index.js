(function() {
    'use strict';

    var async = require("async"), express = require("express"), request = require("request"), endpoints = require("../endpoints"), helpers = require("../../helpers"), app = express(), cookie_name = "logged_in"


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


// Allow cross-origin, traced requests. See http://enable-cors.org/server_expressjs.html
/*app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', [
    'Origin', 'Accept', 'X-Requested-With', 'X-B3-TraceId',
    'X-B3-ParentSpanId', 'X-B3-SpanId', 'X-B3-Sampled'
  ].join(', '));
  next();
});*/


    app.get("/customers/:id", function(req, res, next) {
        helpers.simpleHttpRequest(endpoints.customersUrl + "/" + req.session.customerId, res, next);
    });
    app.get("/cards/:id", function(req, res, next) {
        helpers.simpleHttpRequest(endpoints.cardsUrl + "/" + req.params.id, res, next);
    });

    app.get("/customers", function(req, res, next) {
        helpers.simpleHttpRequest(endpoints.customersUrl, res, next);
    });
    app.get("/addresses", function(req, res, next) {
        helpers.simpleHttpRequest(endpoints.addressUrl, res, next);
    });
    app.get("/cards", function(req, res, next) {
        helpers.simpleHttpRequest(endpoints.cardsUrl, res, next);
    });

    // Create Customer - TO BE USED FOR TESTING ONLY (for now)
    app.post("/customers", function(req, res, next) {
        var options = {
            uri: endpoints.customersUrl,
            method: 'POST',
            json: true,
            body: req.body
        };

        console.log("Posting Customer: " + JSON.stringify(req.body));

        request(options, function(error, response, body) {
            if (error) {
                return next(error);
            }
            helpers.respondSuccessBody(res, JSON.stringify(body));
        }.bind({
            res: res
        }));
    });

    app.post("/addresses", function(req, res, next) {
        var zipkinRestWithAddress =  rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_user_addresses_post'});

        req.body.userID = helpers.getCustomerId(req, app.get("env"));
        /*
        var options = {
            uri: endpoints.addressUrl,
            method: 'POST',
            json: true,
            body: req.body
        };*/
        console.log("Posting Address: " + JSON.stringify(req.body));

        var urlAddress = endpoints.addressUrl;
        zipkinRestWithAddress({method:'POST',path:urlAddress,entity:JSON.stringify(req.body), headers: { 'Content-Type': 'application/json'}})
        .then(
            function(response){
                var body = "";
                if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
                if (typeof body.error !== "undefined" ) {
                    return next(body.error);
                }
                helpers.respondSuccessBody(res, JSON.stringify(body));
            }.bind({
                res: res
            }))
        .catch(err => console.error('Error', err.stack))
        /*
        request(options, function(error, response, body) {
            if (error) {
                return next(error);
            }
            helpers.respondSuccessBody(res, JSON.stringify(body));
        }.bind({
            res: res
        }));*/
    });

    app.get("/card", function(req, res, next) {
        var zipkinRest =  rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_user_card_get'});
        var custId = helpers.getCustomerId(req, app.get("env"));
        /*
        var options = {
            uri: endpoints.customersUrl + '/' + custId + '/cards',
            method: 'GET',
        };*/
        var urlCard=endpoints.customersUrl + '/' + custId + '/cards';
        zipkinRest({method:'GET',path:urlCard})
        .then(
            function(response){
                var body = "";
                if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
                if (typeof body.error !== "undefined" ) {
                    return next(body.error);
                }
                if (body.status_code !== 500 && body._embedded.card.length !== 0 ) {
                    var resp = {
                        "number": body._embedded.card[0].longNum.slice(-4)
                    };
                    return helpers.respondSuccessBody(res, JSON.stringify(resp));
                }
                return helpers.respondSuccessBody(res, JSON.stringify({"status_code": 500}));
            }.bind({
                res: res
            }))
        .catch(err => console.error('Error', err.stack))
        /*
        request(options, function(error, response, body) {
            if (error) {
                return next(error);
            }
            var data = JSON.parse(body);
            if (data.status_code !== 500 && data._embedded.card.length !== 0 ) {
                var resp = {
                    "number": data._embedded.card[0].longNum.slice(-4)
                };
                return helpers.respondSuccessBody(res, JSON.stringify(resp));
            }
            return helpers.respondSuccessBody(res, JSON.stringify({"status_code": 500}));
        }.bind({
            res: res
        }));*/
    });

    app.get("/address", function(req, res, next) {
        var zipkinRest =  rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_user_address_get'});
        var custId = helpers.getCustomerId(req, app.get("env"));
        /*
        var options = {
            uri: endpoints.customersUrl + '/' + custId + '/addresses',
            method: 'GET',
        };*/
        var urlAddress = endpoints.customersUrl + '/' + custId + '/addresses';
        zipkinRest({method:'GET',path:urlAddress})
        .then(
            function(response){
                var body = "";
                if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
                if (typeof body.error !== "undefined" ) {
                    return next(body.error);
                }
                if (body.status_code !== 500 && body._embedded.address.length !== 0 ) {
                    var resp = body._embedded.address[0];
                    return helpers.respondSuccessBody(res, JSON.stringify(resp));
                }
                return helpers.respondSuccessBody(res, JSON.stringify({"status_code": 500}));
            }.bind({
                res: res
            }))
        .catch(err => console.error('Error', err.stack))
        /*
        request(options, function(error, response, body) {
            if (error) {
                return next(error);
            }
            var data = JSON.parse(body);
            if (data.status_code !== 500 && data._embedded.address.length !== 0 ) {
                var resp = data._embedded.address[0];
                return helpers.respondSuccessBody(res, JSON.stringify(resp));
            }
            return helpers.respondSuccessBody(res, JSON.stringify({"status_code": 500}));
        }.bind({
            res: res
        }));*/
    });

    app.post("/cards", function(req, res, next) {
        req.body.userID = helpers.getCustomerId(req, app.get("env"));
        var zipkinRestWithCards =  rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_user_cards_post'});
        /*
        var options = {
            uri: endpoints.cardsUrl,
            method: 'POST',
            json: true,
            body: req.body
        };*/
        console.log("Posting Card: " + JSON.stringify(req.body));

        var urlCards = endpoints.cardsUrl;
        zipkinRestWithCards({method:'POST',path:urlCards,entity:JSON.stringify(req.body),headers: { 'Content-Type': 'application/json'}})
        .then(
            function(response){
                var body = "";
                if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
                if (typeof body.error !== "undefined" ) {
                    return next(body.error);
                }
                helpers.respondSuccessBody(res, JSON.stringify(body));
            }.bind({
                res: res
            }))
        .catch(err => console.error('Error', err.stack))
        /*
        request(options, function(error, response, body) {
            if (error) {
                return next(error);
            }
            helpers.respondSuccessBody(res, JSON.stringify(body));
        }.bind({
            res: res
        }));*/
    });

    // Delete Customer - TO BE USED FOR TESTING ONLY (for now)
    app.delete("/customers/:id", function(req, res, next) {
        console.log("Deleting Customer " + req.params.id);
        var options = {
            uri: endpoints.customersUrl + "/" + req.params.id,
            method: 'DELETE'
        };
        request(options, function(error, response, body) {
            if (error) {
                return next(error);
            }
            helpers.respondSuccessBody(res, JSON.stringify(body));
        }.bind({
            res: res
        }));
    });

    // Delete Address - TO BE USED FOR TESTING ONLY (for now)
    app.delete("/addresses/:id", function(req, res, next) {
        console.log("Deleting Address " + req.params.id);
        var options = {
            uri: endpoints.addressUrl + "/" + req.params.id,
            method: 'DELETE'
        };
        request(options, function(error, response, body) {
            if (error) {
                return next(error);
            }
            helpers.respondSuccessBody(res, JSON.stringify(body));
        }.bind({
            res: res
        }));
    });

    // Delete Card - TO BE USED FOR TESTING ONLY (for now)
    app.delete("/cards/:id", function(req, res, next) {
        console.log("Deleting Card " + req.params.id);
        var options = {
            uri: endpoints.cardsUrl + "/" + req.params.id,
            method: 'DELETE'
        };
        request(options, function(error, response, body) {
            if (error) {
                return next(error);
            }
            helpers.respondSuccessBody(res, JSON.stringify(body));
        }.bind({
            res: res
        }));
    });

    app.post("/register", function(req, res, next) {
        var zipkinRestWithRegister =  rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_user_register'});
        var zipkinRestWithGet =  rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_user_register'});

        /*
        var options = {
            uri: endpoints.registerUrl,
            method: 'POST',
            json: true,
            body: req.body
        };*/

        console.log("Posting Customer: " + JSON.stringify(req.body));
        console.log(req.body);
        async.waterfall([
                function(callback) {
                    var urlPOST = endpoints.registerUrl;
                    zipkinRestWithRegister({method:'POST',path:urlPOST,entity:JSON.stringify(req.body),headers: { 'Content-Type': 'application/json'}})
                    .then(
                        function(response){
                            var body = "";
                            if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
                            if (typeof body.error !== "undefined" ) {
                                console.log(body.error);
                                callback(body.error);
                                return;
                            }
                            if (response.status.code == 200 && body != null && body != "") {
                                if (body.error) {
                                    callback(body.error);
                                    return;
                                }
                                console.log(body);
                                var customerId = body.id;
                                console.log(customerId);
                                req.session.customerId = customerId;
                                callback(null, customerId);
                                return;
                            }
                            console.log(response.status.code);
                            console.log(response.entity);
                            callback(true);
                         })
                    .catch(err => console.error('Error', err.stack))
                    /*
                    request(options, function(error, response, body) {
                        if (error !== null ) {
                            callback(error);
                            return;
                        }
                        if (response.statusCode == 200 && body != null && body != "") {
                            if (body.error) {
                                callback(body.error);
                                return;
                            }
                            console.log(body);
                            var customerId = body.id;
                            console.log(customerId);
                            req.session.customerId = customerId;
                            callback(null, customerId);
                            return;
                        }
                        console.log(response.statusCode);
                        callback(true);
                    });*/
                },
                function(custId, callback) {
                    var sessionId = req.session.id;
                    console.log("Merging carts for customer id: " + custId + " and session id: " + sessionId);
                    /*
                    var  options = {
                        uri: endpoints.cartsUrl + "/" + custId + "/merge" + "?sessionId=" + sessionId,
                        method: 'GET'
                    };*/
                    var urlGet = endpoints.cartsUrl + "/" + custId + "/merge" + "?sessionId=" + sessionId;
                    zipkinRestWithGet({method:'GET',path:urlGet})
                    .then(
                        function(response){
                            var body = "";
                            if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
                            if (typeof body.error !== "undefined") {
                                if(callback) callback(body.error);
                                return;
                            }
                            console.log('Carts merged.');
                            if(callback) callback(null, custId);
                         })
                     .catch(err => console.error('Error', err.stack))
                    /*
                    request(options, function(error, response, body) {
                        if (error) {
                            if(callback) callback(error);
                            return;
                        }
                        console.log('Carts merged.');
                        if(callback) callback(null, custId);
                    });*/
                }
            ],
            function(err, custId) {
                if (err) {
                    console.log("Error with log in: " + err);
                    res.status(500);
                    res.end();
                    return;
                }
                console.log("set cookie" + custId);
                res.status(200);
                res.cookie(cookie_name, req.session.id, {
                    maxAge: 3600000
                }).send({id: custId});
                console.log("Sent cookies.");
                res.end();
                return;
            }
        );
    });

//app.use(expressMiddleware({tracer,serviceName:'frontend-user'}));

    app.get("/login", function(req, res, next) {
        console.log("Received login request");
        var loginHeader = rest.wrap(defaultRequest, { headers: { 'Authorization': req.get('Authorization') } });
        var zipkinRestWithAuth =  loginHeader.wrap(restInterceptor, {tracer, serviceName: 'frontend_user_login'});
        var zipkinRestWithGet =  rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_user_login'});

        async.waterfall([
                function(callback) {
                        var urlAuth=endpoints.loginUrl;
			zipkinRestWithAuth({method:'GET',path:urlAuth})
			.then(
				function(response) {
                                        var body = "";
                                        if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
					if(typeof body.error !== "undefined"){
                            			callback(body.error);
                            			return;
					}
                        		if (response.status.code == 200 && body != null && body != "") {
                            			console.log(body);
                            			var customerId = body.user.id;
                            			console.log(customerId);
                            			req.session.customerId = customerId;
                            			callback(null, customerId);
                            			return;
                        		}
                        		console.log(response.status.code);
                        		callback(true);
                     		})
                        .catch(err => console.error('Error', err.stack))
                   /*
                    var options = {
                        headers: {
                            'Authorization': req.get('Authorization')
                        },
                        uri: endpoints.loginUrl
                    };
                    request(options, function(error, response, body) {
                        if (error) {
                            callback(error);
                            return;
                        }
                        if (response.statusCode == 200 && body != null && body != "") {
                            console.log(body);
                            var customerId = JSON.parse(body).user.id;
                            console.log(customerId);
                            req.session.customerId = customerId;
                            callback(null, customerId);
                            return;
                        }
                        console.log(response.statusCode);
                        callback(true);
                    });*/
                },
                function(custId, callback) {
                    var sessionId = req.session.id;
                    console.log("Merging carts for customer id: " + custId + " and session id: " + sessionId);
			var urlMerge = endpoints.cartsUrl + "/" + custId + "/merge" + "?sessionId=" + sessionId;
			zipkinRestWithGet({method:'GET',path:urlMerge})
                        .then(
                                function(response) {
                                        var body = "";
                                        if(response.entity!=null&&response.entity!=""){body = JSON.parse(response.entity);}
                                        if(typeof body.error !== "undefined"){
                                                // if cart fails just log it, it prevenst login
                            			console.log(body.error);
                            			//return;
                                        }
                                        console.log('Carts merged.');
                                        callback(null, custId);

                                })
                        .catch(err => console.error('Error', err.stack))


		    /*
                    var options = {
                        uri: endpoints.cartsUrl + "/" + custId + "/merge" + "?sessionId=" + sessionId,
                        method: 'GET'
                    };
                    request(options, function(error, response, body) {
                        if (error) {
                            // if cart fails just log it, it prevenst login
                            console.log(error);
                            //return;
                        }
                        console.log('Carts merged.');
                        callback(null, custId);
                    });*/
                }
            ],
            function(err, custId) {
                if (err) {
                    console.log("Error with log in: " + err);
                    res.status(401);
                    res.end();
                    return;
                }
                res.status(200);
                res.cookie(cookie_name, req.session.id, {
                    maxAge: 3600000
                }).send('Cookie is set');
                console.log("Sent cookies.");
                res.end();
                return;
            });
    });

    module.exports = app;
}());
