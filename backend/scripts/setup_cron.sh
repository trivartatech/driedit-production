#!/bin/bash
# Setup cron jobs for automated backups
# Run once during deployment: ./setup_cron.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Make backup scripts executable
chmod +x "$SCRIPT_DIR/backup_db.sh"
chmod +x "$SCRIPT_DIR/backup_uploads.sh"

# Create cron entries
CRON_FILE="/tmp/driedit_cron"

cat > "$CRON_FILE" << EOF
# DRIEDIT Backup Cron Jobs
# MongoDB backup - daily at 2 AM
0 2 * * * $SCRIPT_DIR/backup_db.sh >> /var/log/driedit_backup.log 2>&1

# Uploads backup - daily at 3 AM
0 3 * * * $SCRIPT_DIR/backup_uploads.sh >> /var/log/driedit_backup.log 2>&1

# Clean old log files - weekly on Sunday at 4 AM
0 4 * * 0 find /app/backend/logs -name "*.log.*" -mtime +7 -delete
EOF

# Install cron jobs
crontab "$CRON_FILE"
rm "$CRON_FILE"

echo "Cron jobs installed successfully!"
echo "Current cron schedule:"
crontab -l
