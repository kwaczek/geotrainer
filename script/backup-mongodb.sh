#!/bin/bash
#
# MongoDB Backup Script
# This script creates a backup of the MongoDB database used by GeoTrainer
# It supports both standalone MongoDB installations and Docker deployments
#

# Set variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$HOME/mongodb_backups"
DB_NAME="geotrainer"
CONTAINER_NAME="geotrainer-mongodb"
MAX_BACKUPS=10
COLLECTIONS=("countries" "bollards" "licenseplates" "quizresults" "users" "quizzes")
STATS_FILE="$BACKUP_DIR/backup_stats_$TIMESTAMP.txt"

# Print banner
echo "====================================================="
echo "GeoTrainer MongoDB Backup Script"
echo "Timestamp: $(date)"
echo "====================================================="

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
echo "Using backup directory: $BACKUP_DIR"

# Function to clean up old backups
cleanup_old_backups() {
  echo "Cleaning up old backups, keeping the $MAX_BACKUPS most recent..."
  ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +$((MAX_BACKUPS+1)) | xargs -r rm
  echo "Cleanup complete."
}

# Function for error handling
handle_error() {
  echo "ERROR: $1"
  exit 1
}

# Function to get collection stats using Docker
get_collection_stats_docker() {
  echo "Collecting database statistics..."
  
  echo "DATABASE BACKUP SUMMARY" > "$STATS_FILE"
  echo "-----------------------------------------------------" >> "$STATS_FILE"
  echo "Database: $DB_NAME" >> "$STATS_FILE"
  echo "Timestamp: $(date)" >> "$STATS_FILE"
  echo "-----------------------------------------------------" >> "$STATS_FILE"
  echo "COLLECTION COUNTS:" >> "$STATS_FILE"
  
  local total_documents=0
  
  for collection in "${COLLECTIONS[@]}"; do
    # Get document count for each collection
    local count=$(docker exec "$CONTAINER_NAME" mongosh "$DB_NAME" --quiet --eval "db.$collection.countDocuments()")
    if [[ "$count" =~ ^[0-9]+$ ]]; then
      echo "- $collection: $count documents" >> "$STATS_FILE"
      total_documents=$((total_documents + count))
    else
      echo "- $collection: Error getting count" >> "$STATS_FILE"
    fi
  done
  
  echo "-----------------------------------------------------" >> "$STATS_FILE"
  echo "TOTAL DOCUMENTS BACKED UP: $total_documents" >> "$STATS_FILE"
  echo "-----------------------------------------------------" >> "$STATS_FILE"
  
  cat "$STATS_FILE"
}

# Function to get collection stats using local MongoDB
get_collection_stats_local() {
  echo "Collecting database statistics..."
  
  echo "DATABASE BACKUP SUMMARY" > "$STATS_FILE"
  echo "-----------------------------------------------------" >> "$STATS_FILE"
  echo "Database: $DB_NAME" >> "$STATS_FILE"
  echo "Timestamp: $(date)" >> "$STATS_FILE"
  echo "-----------------------------------------------------" >> "$STATS_FILE"
  echo "COLLECTION COUNTS:" >> "$STATS_FILE"
  
  local total_documents=0
  
  for collection in "${COLLECTIONS[@]}"; do
    # Get document count for each collection
    local count=$(mongosh "$DB_NAME" --quiet --eval "db.$collection.countDocuments()")
    if [[ "$count" =~ ^[0-9]+$ ]]; then
      echo "- $collection: $count documents" >> "$STATS_FILE"
      total_documents=$((total_documents + count))
    else
      echo "- $collection: Error getting count" >> "$STATS_FILE"
    fi
  done
  
  echo "-----------------------------------------------------" >> "$STATS_FILE"
  echo "TOTAL DOCUMENTS BACKED UP: $total_documents" >> "$STATS_FILE"
  echo "-----------------------------------------------------" >> "$STATS_FILE"
  
  cat "$STATS_FILE"
}

# Set trap to handle script interruptions
trap 'echo "Script interrupted"; exit 1' INT TERM

# Determine if we should use Docker or direct mongodump
if command -v docker &> /dev/null && docker ps | grep -q "$CONTAINER_NAME"; then
  echo "MongoDB running in Docker container: $CONTAINER_NAME"
  
  # Create temporary directory for backup
  TMP_BACKUP_DIR="$BACKUP_DIR/tmp_$TIMESTAMP"
  mkdir -p "$TMP_BACKUP_DIR"
  
  # Get statistics before backup
  get_collection_stats_docker
  
  # Copy the stats file to the temporary directory
  cp "$STATS_FILE" "$TMP_BACKUP_DIR/backup_stats.txt"
  
  # Run mongodump inside the Docker container
  echo "Creating backup using Docker..."
  if ! docker exec "$CONTAINER_NAME" mongodump --db "$DB_NAME" --out /tmp/backup; then
    handle_error "Failed to execute mongodump in Docker container"
  fi
  
  # Copy backup from container to host
  echo "Copying backup files from container..."
  if ! docker cp "$CONTAINER_NAME:/tmp/backup/." "$TMP_BACKUP_DIR"; then
    handle_error "Failed to copy backup files from Docker container"
  fi
  
  # Clean up the temporary backup directory in the container
  docker exec "$CONTAINER_NAME" rm -rf /tmp/backup
  
  # Create tarball archive of the backup
  echo "Compressing backup..."
  BACKUP_FILE="$BACKUP_DIR/mongodb_backup_$TIMESTAMP.tar.gz"
  if ! tar -czf "$BACKUP_FILE" -C "$TMP_BACKUP_DIR" .; then
    handle_error "Failed to compress backup"
  fi
  
  # Clean up temporary directory
  rm -rf "$TMP_BACKUP_DIR"
  
elif command -v mongodump &> /dev/null; then
  echo "Using local mongodump command..."
  
  # Create temporary directory for backup
  TMP_BACKUP_DIR="$BACKUP_DIR/tmp_$TIMESTAMP"
  mkdir -p "$TMP_BACKUP_DIR"
  
  # Get statistics before backup
  get_collection_stats_local
  
  # Copy the stats file to the temporary directory
  cp "$STATS_FILE" "$TMP_BACKUP_DIR/backup_stats.txt"
  
  # Run mongodump directly
  if ! mongodump --db "$DB_NAME" --out "$TMP_BACKUP_DIR"; then
    handle_error "Failed to execute mongodump"
  fi
  
  # Create tarball archive of the backup
  echo "Compressing backup..."
  BACKUP_FILE="$BACKUP_DIR/mongodb_backup_$TIMESTAMP.tar.gz"
  if ! tar -czf "$BACKUP_FILE" -C "$TMP_BACKUP_DIR" .; then
    handle_error "Failed to compress backup"
  fi
  
  # Clean up temporary directory
  rm -rf "$TMP_BACKUP_DIR"
  
else
  handle_error "Neither Docker nor mongodump found. Cannot perform backup."
fi

# Clean up old backups
cleanup_old_backups

# Calculate backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo "====================================================="
echo "Backup completed successfully!"
echo "Backup file: $BACKUP_FILE"
echo "Backup size: $BACKUP_SIZE"
echo "Database: $DB_NAME"
echo "Timestamp: $(date)"
echo "====================================================="

# Clean up stats file
rm -f "$STATS_FILE"

exit 0 