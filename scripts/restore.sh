#!/bin/bash

# MongoDB Restore Script for PlayStation Wishlist System
# Usage: ./restore.sh [backup_folder]

# config
BACKUP_DIR="./backups"

# mongo connection (reads from .env or uses default)
if [ -f .env ]; then
    source .env 2>/dev/null || export $(grep -v '^#' .env | xargs)
fi

MONGO_URI="${MONGODB_URI:-mongodb://localhost:27017/playstation_wishlist}"

# list available backups
echo "Available backups:"
ls -dt "$BACKUP_DIR"/backup_* 2>/dev/null | head -10 | while read dir; do
    SIZE=$(du -sh "$dir" 2>/dev/null | cut -f1)
    echo "  $(basename "$dir")  ($SIZE)"
done

echo ""

# choose backup
if [ -n "$1" ]; then
    # Use specified backup
    if [ -d "$BACKUP_DIR/$1" ]; then
        RESTORE_PATH="$BACKUP_DIR/$1"
    elif [ -d "$1" ]; then
        RESTORE_PATH="$1"
    else
        echo "Backup not found: $1"
        exit 1
    fi
else
    # otherwise use the newest one
    RESTORE_PATH=$(ls -dt "$BACKUP_DIR"/backup_* 2>/dev/null | head -1)
    if [ -z "$RESTORE_PATH" ]; then
        echo "No backups found in $BACKUP_DIR"
        exit 1
    fi
fi

echo "Selected backup: $(basename "$RESTORE_PATH")"

# user confirmation just incase
read -p "WARNING: This will OVERWRITE the current database. Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo "Restoring from backup..."

# run mongorestore with --drop to replace existing data
mongorestore --uri="$MONGO_URI" --drop "$RESTORE_PATH"

# check if restore was successful
if [ $? -eq 0 ]; then
    echo "Restore completed successfully"
else
    echo "Restore failed"
    exit 1
fi
