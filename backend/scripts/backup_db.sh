#!/bin/bash
# MongoDB Backup Script for DRIEDIT
# Schedule with cron: 0 2 * * * /app/backend/scripts/backup_db.sh

set -e

# Configuration
BACKUP_DIR="/app/backups/mongodb"
RETENTION_DAYS=7
DB_NAME="${DB_NAME:-test_database}"
MONGO_URL="${MONGO_URL:-mongodb://localhost:27017}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="driedit_backup_${DATE}"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting MongoDB backup..."

# Run mongodump
mongodump --uri="$MONGO_URL" --db="$DB_NAME" --out="$BACKUP_DIR/$BACKUP_NAME"

# Compress backup
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

echo "[$(date)] Backup created: ${BACKUP_NAME}.tar.gz"

# Clean up old backups (keep last RETENTION_DAYS days)
find "$BACKUP_DIR" -name "driedit_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Cleaned up backups older than $RETENTION_DAYS days"

# Optional: Upload to cloud storage (S3/GCS)
# Uncomment and configure as needed:
# aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" s3://your-bucket/backups/
# gsutil cp "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" gs://your-bucket/backups/

echo "[$(date)] MongoDB backup completed successfully"
