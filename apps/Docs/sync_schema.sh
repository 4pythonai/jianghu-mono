#!/bin/bash

# 数据库配置
DB_HOST="140.179.50.120"
DB_USER="root"
DB_PASS="cnix@123456"
DB_NAME="gtest"

# 输出目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/db-schema"
OUTPUT_FILE="${OUTPUT_DIR}/golf_app_schema.sql"
TEMP_FILE="${OUTPUT_DIR}/.temp_schema.sql"

# 创建输出目录
mkdir -p "${OUTPUT_DIR}"

# 清理旧文件
rm -f "${OUTPUT_FILE}"

echo "🔄 开始同步数据库 schema..."
echo "   数据库: ${DB_NAME}@${DB_HOST}"

# 导出表结构（不含数据）
echo "📋 导出表结构..."
mysqldump -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASS}" \
    --no-data \
    --skip-comments \
    --skip-add-drop-table \
    --skip-lock-tables \
    --compact \
    "${DB_NAME}" > "${TEMP_FILE}"

if [ $? -ne 0 ]; then
    echo "❌ 导出表结构失败"
    rm -f "${TEMP_FILE}"
    exit 1
fi

# 清理输出：去掉 /*!...*/ 注释，在 CREATE TABLE 前加空行
echo "🧹 清理格式..."
grep -v '^/\*![0-9]' "${TEMP_FILE}" | \
    grep -v '^$' | \
    awk '{if(/^CREATE TABLE/) print "\n"; print}' | \
    sed '/./,$!d' > "${OUTPUT_FILE}"

rm -f "${TEMP_FILE}"

echo "✅ 表结构已导出到: ${OUTPUT_FILE}"
echo ""
echo "🎉 同步完成！"
echo "   - 表结构: ${OUTPUT_FILE}"

