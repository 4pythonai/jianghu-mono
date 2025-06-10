#!/bin/bash

# Database connection details
DB_HOST="140.179.50.120"
DB_USER="root"
DB_PASS="cnix@123456"
DB_NAME="gtest"
OUTPUT_DIR="Docs/db-schema"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Clear old sql files
> "$OUTPUT_DIR/schema.sql"
> "$OUTPUT_DIR/sample_data.sql"

# Get list of tables
TABLES=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e "SHOW TABLES;")

# Dump schema for all tables
echo "Dumping database schema..."
mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" \
    --no-data \
    --skip-triggers \
    --skip-comments \
    --skip-set-charset \
    --compact \
    "$DB_NAME" > "$OUTPUT_DIR/schema.sql"

# Dump sample data (10 rows) for each table
for TABLE in $TABLES; do
    echo "Dumping sample data for table: $TABLE"
    mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" \
        --no-create-info \
        --skip-triggers \
        --skip-comments \
        --skip-set-charset \
        --compact \
        --where="1 LIMIT 10" \
        "$DB_NAME" "$TABLE" >> "$OUTPUT_DIR/sample_data.sql"
done

# Remove all /*! ... */ MySQL version comments from schema.sql and sample_data.sql
sed -i '' '/^\/\*!/d' "$OUTPUT_DIR/schema.sql"
sed -i '' '/^\/\*!/d' "$OUTPUT_DIR/sample_data.sql"

echo "Backup completed in directory: $OUTPUT_DIR"
echo "Files created:"
echo "- $OUTPUT_DIR/schema.sql (database schema)"
echo "- $OUTPUT_DIR/sample_data.sql (sample data for all tables)" 