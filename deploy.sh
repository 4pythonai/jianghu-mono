#!/bin/bash

# /usr/local/bin/sshpass    ssh -l root  103.151.148.2  -p 10020
# /Users/alex/codebase/golf/mini-api

echo "请关闭VPN"

rm -fr /Users/alex/codebase/golf/mini-api/v2/application/config/database.php
rm -fr /Users/alex/codebase/golf/mini-api/v2/application/config/config.php
cp /Users/alex/codebase/golf/mini-api/v2/application/config/database-server.php /Users/alex/codebase/golf/mini-api/v2/application/config/database.php
cp /Users/alex/codebase/golf/mini-api/v2/application/config/config-server.php /Users/alex/codebase/golf/mini-api/v2/application/config/config.php

# 设置本地和远程目录路径
local_path="/Users/alex/codebase/golf/mini-api/v2/"
remote_path="/data/aws/mini-api/v2"


server_address="140.179.50.120"
server_port="22"
server_username="ubuntu"


#!/bin/bash

# 设置本地和远程目录路径

pem="/Users/alex/.ssh/cloud-CRM-aws.pem"

# -av --no-times

# 使用 rsync 清除远程目录并同步本地目录到服务器
rsync --progress -rlptD --no-times --no-perms --no-owner --no-group   --delete -e "ssh -i $pem -p $server_port" "$local_path" "$server_username@$server_address:$remote_path"

cp /Users/alex/codebase/golf/mini-api/v2/application/config/database-local.php /Users/alex/codebase/golf/mini-api/v2/application/config/database.php
cp /Users/alex/codebase/golf/mini-api/v2/application/config/config-local.php /Users/alex/codebase/golf/mini-api/v2/application/config/config.php
