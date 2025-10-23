
docker kill mini-api
docker rm  mini-api

docker kill mini-api
docker rm   mini-api
if [ ! -d logs ]; then mkdir logs; fi

docker run -itd --rm -p 7800:80 -p 6380:6379  --name mini-api  -v $PWD:/var/www/html --privileged=true tangyongjin/php73-redis
