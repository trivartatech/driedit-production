#!/bin/bash
# Uploads Backup Script for DRIEDIT
# Schedule with cron: 0 3 * * * /app/backend/scripts/backup_uploads.sh

set -e

# Configuration
UPLOADS_DIR="/app/backend/uploads"
BACKUP_DIR="/app/backups/uploads"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="uploads_backup_${DATE}"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting uploads backup..."

# Create tarball of uploads directory
cd "$UPLOADS_DIR/.."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" uploads/

echo "[$(date)] Backup created: ${BACKUP_NAME}.tar.gz"

# Calculate backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)
echo "[$(date)] Backup size: $BACKUP_SIZE"

# Clean up old backups (keep last RETENTION_DAYS days)
find "$BACKUP_DIR" -name "uploads_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Cleaned up backups older than $RETENTION_DAYS days"

# Optional: Upload to cloud storage (S3/GCS)
# Uncomment and configure as needed:
# aws s3 sync "$UPLOADS_DIR" s3://your-bucket/uploads/ --delete
# gsutil -m rsync -r "$UPLOADS_DIR" gs://your-bucket/uploads/

echo "[$(date)] Uploads backup completed successfully"
