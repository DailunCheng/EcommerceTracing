Tracing Documentation
---

The Sock Shop application should ideally use Zipkin to trace all requests and serves as a latency input for the resource allocator.
Here is some of the work that should be done eventually:
1. (partially done) Trace all service containers 
2. (Needed)         Trace database containers for their service container using tcpdump. 
3. (Done)           Extract tracing data from Zipkin API and compute the latency for each container. 
4. (Needed)         Switch to an scientific load generator. (Ex. wrk2)
5. (Done)           Sample trace when doing load test.
6. (Needed)         Add more application annotations for fine-grained bottleneck analysis(queuing size, function-level latency)

P.S. To run the load test with sampling, use branch tracingWithSampling. But all documentation and future development are in this tracing branch.

P.P.S To get help from open source community, go ask in gitter!
[Zipkin](https://gitter.im/openzipkin/zipkin)
[Spring-Boot](https://gitter.im/spring-projects/spring-boot)
[Spring-Cloud-Sleuth](https://gitter.im/spring-cloud/spring-cloud-sleuth)

## General structure

1. To understand how Zipkin works in general, check the awesome demonstration in the introduction section of [spring-cloud-sleuth](https://github.com/spring-cloud/spring-cloud-sleuth)

2. Currently order, payment, user, catalogue, cart, wishlist, shipping have built in tracing implementation. All we need to do is to turn them on. Front-end is completely built from the bottom up, with some functions left out. RabbitMQ and Queue-Master are not traced but there will be section to talk about the current attempt on tracing them. 

3. Currently the zipkin configuration in docker-compose file and recorder file is hardcoded to work on ath-3. Change the IP address in those files if you change the server.

## Implementation categorized as functionality

### microservice-demo (application deployment)

1. Add zipkin container in the [docker-compose configuration](../tracing/microservices-demo/deploy/docker-compose/docker-compose.yml).

```
  zipkin:
    image: openzipkin/zipkin
    hostname: zipkin
    restart: always
    cap_drop:
        - all
    cap_add:
        - CHOWN
        - SETGID
        - SETUID
    read_only: true
    tmpfs:
        - /tmp:rw,noexec,nosuid
    environment:
        - reschedule=on-node-failure
    ports:
        - "9411:9411"
```

### Java service containers (order,cart,wishlist,shipping)

1. switch the "spring.zipkin.enabled" to true in corresponding src/main/resources/application.properties.
2. Compile and build the container
3. Include the container name (usually with a ":test" in the end) in [docker-compose configuration](../tracing/microservices-demo/deploy/docker-compose/docker-compose.yml)
4. Run docker-compose up again.

### Go service containers

1. Add environment zipkin configuration in [docker-compose configuration](../tracing/microservices-demo/deploy/docker-compose/docker-compose.yml)
```
     environment:
       - ZIPKIN=http://zipkin:9411/api/v1/spans
```

### Front-end service container

0. [The streaming (pipe) request cannot use cujojs to add tracing header](https://github.com/cujojs/rest/pull/56). This happens in order and catalogue. There is a wierd bug in post order request, which I documented in the code and the commit message. Some of the unused testing method in user is not traced. All other functions are traced.

1. For any tracer in zipkin-js, you can set the sample rate as following:
```
    const tracer = new Tracer({ctxImpl, recorder,sampler: new zipkin.sampler.CountingSampler(0.01)});
```
You can check the parameter for Tracer [here](https://github.com/openzipkin/zipkin-js/tree/master/packages/zipkin)

2. Since the front-end is using express, ideally everything should use [zipkin-instrumentation-express](https://github.com/openzipkin/zipkin-js/tree/master/packages/zipkin-instrumentation-express) but some functions got removed in Node.js release and break the application. Please check back this issue to see if it gets fixed. https://github.com/openzipkin/zipkin-js/issues/151

3. The workaround is to use [zipkin-instrumentation-express](https://github.com/openzipkin/zipkin-js/tree/master/packages/zipkin-instrumentation-express) in the server side (front-end receive request from user) and [zipkin-instrumentation-cujojs-rest](https://github.com/openzipkin/zipkin-js/tree/master/packages/zipkin-instrumentation-cujojs-rest) for the client side (front-end send subsequent request to other back-end containers). All modification happens in /api and /helper

3. Currently server tracing is done using [zipkin-instrumentation-express](https://github.com/openzipkin/zipkin-js/tree/master/packages/zipkin-instrumentation-express). The example code is: 
```
const zipkinMiddleware = require('zipkin-instrumentation-express').expressMiddleware;
app.use(zipkinMiddleware({tracer:tracer,serviceName:'frontend'}));
```

4. The client side tracing is done using [zipkin-instrumentation-cujojs-rest](https://github.com/openzipkin/zipkin-js/tree/master/packages/zipkin-instrumentation-cujojs-rest). 

#### Cujojs

Cujojs help you add/modify header, request/response by calling wrap. If multiple wrap is needed, simply stack them together.

(1) Wrap a general HTTP request with zipkin tracing info and the span name of the trace:
Example: user register
```var zipkinRestWithGet =  rest.wrap(restInterceptor, {tracer, serviceName: 'frontend_user_register'});```

(2) When you want to send out the request, call the wrapped function and pass in the type of request (method), destination path (path), optional payload (entity), optional headers (headers):
Example: user register
```zipkinRestWithRegister({method:'POST',path:urlPOST,entity:JSON.stringify(req.body),headers: { 'Content-Type': 'application/json'}})```

(3) The actions after received the response:
Example: user register
```
zipkinRestWithRegister({method:'POST',path:urlPOST,entity:JSON.stringify(req.body),headers: { 'Content-Type': 'application/json'}})
.then(
    function(response){...})
.catch(...)
```

(4) Be aware of when to use the actual object and when to use the stringify JSON string of the object

### RabbitMQ and Queue-master

1. The current issue is that shipping container won't pass along the tracing information to RabbitMQ. The pomTrial.xml solution stored in shipping is to add dependency in sleuth(brave) so that the library can intercept and instrument rabbitmqtemplate without adding code in the original application. However, I am getting compatibility problem with spring-cloud-sleuth 2.0.0.RC1 and original spring-boot 1.4.0.RELEASE. To use auto instrumentation, the dependency for spring-cloud-sleuth has to be above 2.0.0.RC1. 

2. The second approach is to add [brave-instrumentation-spring-rabbit](https://github.com/DailunCheng/shipping) manually. But I have trouble importing method SpringRabbitTracing from the original spring rabbit repo.

2. Two examples here about how to instrument the shipping/Queue-master to pass trace through rabbitmq. [Sleuth One](https://github.com/openzipkin/sleuth-webmvc-example/compare/add-rabbit-tracing) [The brave one](https://github.com/openzipkin/brave/tree/b3e52c15aef4b34f5e672b119adb22203242d604/instrumentation/spring-rabbit)



