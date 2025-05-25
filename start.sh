
docker kill cnix-boss-portal-api
docker rm  cnix-boss-portal-api

docker kill cloud-crm-api
docker rm   cloud-crm-api
if [ ! -d logs ]; then mkdir logs; fi

docker run -itd --rm -p 8087:80 -p 6379:6379  --name cloud-crm-api  -v $PWD:/var/www/html --privileged=true tangyongjin/php73-redis
