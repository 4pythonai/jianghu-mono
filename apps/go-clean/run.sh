#!/bin/bash

# go-clean 运行脚本
# 用于分析 jianghu 项目中未使用的 API 端点

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 默认路径（相对于 apps 目录）
API_MODULES="${PROJECT_ROOT}/jianghu-weixin/api/modules"
CONTROLLERS="${PROJECT_ROOT}/jianghu-api/v3/application/controllers"
MODELS="${PROJECT_ROOT}/jianghu-api/v3/application/models"

cd "$SCRIPT_DIR"

# 检查是否需要重新编译
if [ ! -f "./go-clean" ] || [ "$(find . -name '*.go' -newer ./go-clean 2>/dev/null | head -1)" ]; then
    echo "🔨 编译 go-clean..."
    go build -buildvcs=false -o go-clean .
    echo "✅ 编译完成"
    echo
fi

# 运行分析
echo "🚀 运行分析..."
echo
./go-clean \
    --api-modules="$API_MODULES" \
    --controllers="$CONTROLLERS" \
    --models="$MODELS"
