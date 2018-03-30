# EcommerceMicroservices

## Introduction

This application is cloned and modified from Sock Shop. 

This is their github repo: https://github.com/microservices-demo

This is their documentation: https://microservices-demo.github.io/docs/

This is their application design and figure: https://github.com/microservices-demo/microservices-demo/blob/master/internal-docs/design.md

This is their quickstart guide if you want to feel their original application: https://microservices-demo.github.io/docs/quickstart.html

This is their Slack discussion board if you have questions about any implementation detail of Sock Shop: https://weave-community.slack.com/messages/C2NQUAUHE/details/


## Configuration Detail

### Run all docker container: 

```
cd microservice-demo/
docker-compose -f deploy/docker-compose/docker-compose.yml up -d
```
### Stop all docker container:
```
cd microservice-demo/
docker-compose -f deploy/docker-compose/docker-compose.yml down
```
### Custom built local docker images:
catalogue: docker-compose build

user: docker-compose build

carts: GROUP=weaveworksdemos COMMIT=test ./scripts/build.sh

queue-master: GROUP=weaveworksdemos COMMIT=test ./scripts/build.sh

shipping: GROUP=weaveworksdemos COMMIT=test ./scripts/build.sh

orders: GROUP=weaveworksdemos COMMIT=test ./scripts/build.sh

payment: docker-compose build

load-test: docker build -t load-test .

front-end (a little bit different): docker build -t cdl1995/front-end .

wishlists: GROUP=weaveworksdemos COMMIT=test ./scripts/build.sh


### Configure custom built images to the whole application
```
// Stop all running containers
cd microservice-demo/
vi deploy/docker-compose/docker-compose.yml
// Change value "image" in the existing images to your custom image name
// Start all containers again
```

## Useful docker command:

Add your account into docker group so that you don't need sudo for every docker command. Log back in after running it to effect:
```
sudo gpasswd -a $USER docker
```

View all running docker containers: 
```
docker ps
```

View all images: 
```
docker images
```

Remove images to prevent caching: 
```
docker rmi -f <docker_image_id>
```

Tag docker image to custom name so that it is ready to push to docker hub:
```
docker tag <docker_image_id> <username>/<custom_image_name>
```

Push docker image to docker hub:
```
docker login (First time only)
docker push
```

Inspect docker images or containers:
```
docker inspect <docker_id>
```

Enter interactive mode of a running container and run shell command (useful when checking container's file system):
```
docker exec -it <docker_id> sh
```

View real time docker container memory and cpu usage:
```
docker stats <docker_container_name>
```

Change memory usage:
```
sudo docker update --memory <Memory_amount> <docker_container_name>
Example: sudo docker update --memory 15M dockercompose_payment_1
```

Change CPU usage:
```
sudo docker update --cpuset-cpus=<assigned_core> <docker_container_name>
Example: sudo docker update --cpuset-cpus="3-3" dockercompose_payment_1
```

## Other useful commands:

View cluster IP address:
```
curl ifconfig.me
```

View cluster hardware information:
```
lscpu
```

Linux interactive process viewer:
```
htop
```



