#payment
sudo docker update --memory 15M dockercompose_payment_1
#shipping
sudo docker update --memory 550M dockercompose_shipping_1
#catalogue
sudo docker update --memory 100M dockercompose_catalogue_1
#rabbitmq
sudo docker update --memory 450M dockercompose_rabbitmq_1
#orders 
sudo docker update --memory 300M dockercompose_orders_1
#orders_db
sudo docker update --memory 95M dockercompose_orders-db_1
#cart_db
sudo docker update --memory 200M dockercompose_carts-db_1
#user db
sudo docker update --memory 65M dockercompose_user-db_1
#user
sudo docker update --memory 350M dockercompose_user_1
#queue master
sudo docker update --memory 95G dockercompose_queue-master_1
#catalogue db
sudo docker update --memory 1.1G dockercompose_catalogue-db_1
#edge router
#sudo docker update --memory 4M dockercompose_edge-router_1
#front end
sudo docker update --memory 90M dockercompose_front-end_1
#carts
sudo docker update --memory 600M dockercompose_carts_1
#wishlist
sudo docker update --memory 550M dockercompose_wishlists_1
#wishlist-db
sudo docker update --memory 150M dockercompose_wishlists-db_1

