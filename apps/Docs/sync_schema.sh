#!/bin/bash

# 数据库配置
DB_HOST="140.179.50.120"
DB_USER="root"
DB_PASS="cnix@123456"
DB_NAME="gtest"

# 输出目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/db-schema"

# 创建输出目录
mkdir -p "${OUTPUT_DIR}"

#清理旧文件
rm -f "${OUTPUT_DIR}/golf_app_schema.sql"

# 时间戳
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🔄 开始同步数据库 schema..."
echo "   数据库: ${DB_NAME}@${DB_HOST}"

# 导出表结构（不含数据）
echo "📋 导出表结构..."
mysqldump -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASS}" \
    --no-data \
    --skip-comments \
    --skip-add-drop-table \
    --skip-lock-tables \
    "${DB_NAME}" > "${OUTPUT_DIR}/golf_app_schema.sql"

if [ $? -eq 0 ]; then
    echo "✅ 表结构已导出到: ${OUTPUT_DIR}/golf_app_schema.sql"
else
    echo "❌ 导出表结构失败"
    exit 1
fi


echo ""
echo "🎉 同步完成！"
echo "   - 表结构: ${OUTPUT_DIR}/golf_app_schema.sql"

