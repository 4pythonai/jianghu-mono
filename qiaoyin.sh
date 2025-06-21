#!/bin/bash

# /usr/local/bin/sshpass   -p 'Projectx202!'  ssh -l  root 39.105.159.105 

echo "请关闭VPN"

rm -fr /Users/alex/codebase/golf/mini-api/v3/application/config/database.php
rm -fr /Users/alex/codebase/golf/mini-api/v3/application/config/config.php
cp /Users/alex/codebase/golf/mini-api/v3/application/config/database-server.php /Users/alex/codebase/golf/mini-api/v3/application/config/database.php
cp /Users/alex/codebase/golf/mini-api/v3/application/config/config-server.php /Users/alex/codebase/golf/mini-api/v3/application/config/config.php

# 设置本地和远程目录路径
local_path="/Users/alex/codebase/golf/mini-api/v3/"
remote_path="/home/webapps/api-x/v3"


server_address="39.105.159.105"
server_port="22"
server_username="root"


# 设置本地和远程目录路径

pem="/Users/alex/.ssh/qiaoyin.pem"

rsync --progress -avz --delete -e  "ssh -i $pem -p $server_port" "$local_path" "$server_username@$server_address:$remote_path"
cp /Users/alex/codebase/golf/mini-api/v3/application/config/database-local.php /Users/alex/codebase/golf/mini-api/v3/application/config/database.php
cp /Users/alex/codebase/golf/mini-api/v3/application/config/config-local.php /Users/alex/codebase/golf/mini-api/v3/application/config/config.php
