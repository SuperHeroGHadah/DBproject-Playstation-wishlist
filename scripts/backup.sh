#!/bin/bash

# MongoDB Backup Script for PlayStation Wishlist System
# Usage: ./backup.sh

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
RETENTION_DAYS=7

# mongo connection (reads from .env or uses default)
if [ -f .env ]; then
    source .env 2>/dev/null || export $(grep -v '^#' .env | xargs)
fi

MONGO_URI="${MONGODB_URI:-mongodb://localhost:27017/playstation_wishlist}"

# create backup directory
mkdir -p "$BACKUP_PATH"

echo "Starting backup..."
echo "Destination: $BACKUP_PATH"

# run mongodump
mongodump --uri="$MONGO_URI" --out="$BACKUP_PATH"

# check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup completed successfully"
    echo "Location: $BACKUP_PATH"
    
    # show backup size
    BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
    echo "Size: $BACKUP_SIZE"
    
    #c leanup old backups
    echo "Cleaning up backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -type d -name "backup_*" -mtime +$RETENTION_DAYS -exec rm -rf {} + 2>/dev/null
    echo "Done"
else
    echo "Backup failed"
    rm -rf "$BACKUP_PATH"
    exit 1
fi
