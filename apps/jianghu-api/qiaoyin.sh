#!/bin/bash

# /usr/local/bin/sshpass   -p 'Projectx202!'  ssh -l  root 39.105.159.105 

echo "请关闭VPN"

# 设置API路径变量
api_path="/Users/alex/codebase/golf/jianghu-mono/apps/jianghu-api"

rm -fr $api_path/v3/application/config/database.php
rm -fr $api_path/v3/application/config/config.php
cp $api_path/v3/application/config/database-server.php $api_path/v3/application/config/database.php
cp $api_path/v3/application/config/config-server.php $api_path/v3/application/config/config.php

# 设置服务器连接信息
server_address="39.105.159.105"
server_port="22"
server_username="root"
pem="/Users/alex/.ssh/qiaoyin.pem"

# 同步 v3 目录
local_v3_path="$api_path/v3/"
remote_v3_path="/home/webapps/api-x/v3"
rsync --progress -avz --delete -e  "ssh -i $pem -p $server_port" "$local_v3_path" "$server_username@$server_address:$remote_v3_path"

# 同步 workerman 目录
local_workerman_path="$api_path/workerman/"
remote_workerman_path="/home/webapps/api-x/workerman"
rsync --progress -avz --delete -e  "ssh -i $pem -p $server_port" "$local_workerman_path" "$server_username@$server_address:$remote_workerman_path"





# 恢复本地配置文件
cp $api_path/v3/application/config/database-local.php $api_path/v3/application/config/database.php
cp $api_path/v3/application/config/config-local.php $api_path/v3/application/config/config.php
