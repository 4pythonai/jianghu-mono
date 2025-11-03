#!/bin/bash

# /usr/local/bin/sshpass   -p 'Projectx202!'  ssh -l  root 39.105.159.105 

# 不使用 set -e，而是手动处理错误
# 禁用输出缓冲，确保实时看到输出
unset IFS

echo "[请关闭___VPN]"

# 设置API路径变量
api_path="/Users/alex/codebase/golf/jianghu-mono/apps/jianghu-api"

# 检查本地路径是否存在
if [ ! -d "$api_path/workerman" ]; then
    echo "错误: workerman 目录不存在: $api_path/workerman"
    exit 1
fi

if [ ! -d "$api_path/v3" ]; then
    echo "错误: v3 目录不存在: $api_path/v3"
    exit 1
fi

echo "准备配置文件..."
rm -fr $api_path/v3/application/config/database.php
rm -fr $api_path/v3/application/config/config.php
cp $api_path/v3/application/config/database-server.php $api_path/v3/application/config/database.php
cp $api_path/v3/application/config/config-server.php $api_path/v3/application/config/config.php

# 设置服务器连接信息
server_address="39.105.159.105"
server_port="22"
server_username="root"
pem="/Users/alex/.ssh/qiaoyin.pem"

# 检查 SSH 密钥文件是否存在
if [ ! -f "$pem" ]; then
    echo "错误: SSH 密钥文件不存在: $pem"
    exit 1
fi

# 测试 SSH 连接
echo "测试 SSH 连接..."
if ssh -i "$pem" -p "$server_port" -o ConnectTimeout=5 "$server_username@$server_address" "echo 'SSH 连接成功'" >/dev/null 2>&1; then
    echo "✓ SSH 连接成功"
else
    echo "错误: SSH 连接失败"
    exit 1
fi

# 同步 v3 目录
echo ""
echo "=========================================="
echo "开始同步 v3 目录..."
echo "=========================================="
local_v3_path="$api_path/v3/"
remote_v3_path="/home/webapps/api-x/v3"
rsync --progress -avz --delete -e "ssh -i $pem -p $server_port" "$local_v3_path" "$server_username@$server_address:$remote_v3_path"
if [ $? -eq 0 ]; then
    echo ""
    echo "✓ v3 目录同步完成"
else
    echo ""
    echo "错误: v3 目录同步失败"
    exit 1
fi

# 同步 workerman 目录
echo ""
echo "=========================================="
echo "开始同步 workerman 目录..."
echo "=========================================="
local_workerman_path="$api_path/workerman/"
remote_workerman_path="/home/webapps/api-x/workerman"

echo "本地路径: $local_workerman_path"
echo "远程路径: $remote_workerman_path"

# 确保远程目录存在
echo "确保远程目录存在..."
if ssh -i "$pem" -p "$server_port" "$server_username@$server_address" "mkdir -p $remote_workerman_path" >/dev/null 2>&1; then
    echo "✓ 远程目录已创建/确认存在"
else
    echo "错误: 无法创建远程目录"
    exit 1
fi

# 执行同步
echo "执行 rsync 同步..."
rsync --progress -avz --delete -e "ssh -i $pem -p $server_port" "$local_workerman_path" "$server_username@$server_address:$remote_workerman_path"
sync_result=$?
echo "rsync 退出码: $sync_result" >&2
if [ $sync_result -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✓ workerman 目录同步完成"
    echo "=========================================="
else
    echo ""
    echo "错误: workerman 目录同步失败（退出码: $sync_result）"
    exit 1
fi

# 验证同步结果
echo ""
echo "=========================================="
echo "验证同步结果..."
echo "=========================================="
remote_files=$(ssh -i "$pem" -p "$server_port" "$server_username@$server_address" "ls -la $remote_workerman_path | wc -l" 2>/dev/null || echo "0")
if [ "$remote_files" -gt 3 ]; then
    echo "✓ workerman 目录验证成功（包含 $((remote_files - 3)) 个文件/目录）"
else
    echo "警告: workerman 目录可能为空或同步失败"
fi

# 恢复本地配置文件
echo ""
echo "恢复本地配置文件..."
cp $api_path/v3/application/config/database-local.php $api_path/v3/application/config/database.php
cp $api_path/v3/application/config/config-local.php $api_path/v3/application/config/config.php
echo "✓ 本地配置文件已恢复"

echo ""
echo "=========================================="
echo "所有操作完成！"
echo "=========================================="
