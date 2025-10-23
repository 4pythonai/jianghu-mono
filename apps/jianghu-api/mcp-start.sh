#!/bin/bash

# MCP Server启动脚本 - 用于连接MySQL数据库
# 支持Codex CLI使用

echo "启动MySQL MCP Server..."

# 设置环境变量
export MYSQL_HOST=140.179.50.120
export MYSQL_PORT=3306
export MYSQL_USER=root
export MYSQL_PASSWORD=cnix@123456
export MYSQL_DATABASE=gtest

# 启动MCP server
echo "连接到MySQL数据库: $MYSQL_HOST:$MYSQL_PORT/$MYSQL_DATABASE"
npx mysql-mcp-server
