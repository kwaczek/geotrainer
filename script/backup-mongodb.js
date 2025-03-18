#!/usr/bin/env node
/**
 * MongoDB Backup Script using Node.js
 * This script creates a backup of the MongoDB database for GeoTrainer
 * It works even if the mongodump utility is not available
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { MongoClient } = require('mongodb');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const DB_NAME = 'geotrainer';
const MONGO_URI = 'mongodb://localhost:27017/' + DB_NAME;
const BACKUP_DIR = path.join(process.env.HOME, 'mongodb_backups');
const TIMESTAMP = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
const MAX_BACKUPS = 10;

// Main backup function
async function backup() {
  console.log('=====================================================');
  console.log('GeoTrainer MongoDB Backup Script (Node.js)');
  console.log(`Timestamp: ${new Date().toString()}`);
  console.log('=====================================================');

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  console.log(`Using backup directory: ${BACKUP_DIR}`);

  const tempDir = path.join(BACKUP_DIR, `tmp_${TIMESTAMP}`);
  const dbDir = path.join(tempDir, DB_NAME);
  fs.mkdirSync(dbDir, { recursive: true });

  // Attempt to use mongodump if available
  try {
    await tryMongodump(tempDir);
    console.log('Backup created with mongodump successfully!');
  } catch (err) {
    console.log('mongodump not available, falling back to MongoDB driver...');
    await backupWithDriver(dbDir);
  }

  // Create backup stats
  const statsFile = path.join(tempDir, 'backup_stats.txt');
  await createBackupStats(statsFile);

  // Create tarball
  const backupFile = path.join(BACKUP_DIR, `mongodb_backup_${TIMESTAMP}.tar.gz`);
  console.log(`Creating compressed backup at: ${backupFile}`);
  await execPromise(`tar -czf "${backupFile}" -C "${tempDir}" .`);

  // Clean up temp directory
  fs.rmSync(tempDir, { recursive: true, force: true });

  // Clean up old backups
  await cleanupOldBackups();

  // Get file size
  const stats = fs.statSync(backupFile);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('=====================================================');
  console.log('Backup completed successfully!');
  console.log(`Backup file: ${backupFile}`);
  console.log(`Backup size: ${fileSizeMB} MB`);
  console.log(`Database: ${DB_NAME}`);
  console.log(`Timestamp: ${new Date().toString()}`);
  console.log('=====================================================');
}

// Try to use mongodump if available
async function tryMongodump(tempDir) {
  try {
    console.log('Attempting to use mongodump...');
    await execPromise(`mongodump --db ${DB_NAME} --out ${tempDir}`);
    return true;
  } catch (error) {
    console.log('mongodump not found, trying to find it in other locations...');
    
    // Look for mongodump in common locations
    const possiblePaths = [
      '/usr/bin/mongodump',
      '/usr/local/bin/mongodump',
      '/opt/mongodb/bin/mongodump',
      '/var/lib/mongo/bin/mongodump'
    ];
    
    for (const mongodumpPath of possiblePaths) {
      try {
        if (fs.existsSync(mongodumpPath)) {
          console.log(`Found mongodump at: ${mongodumpPath}`);
          await execPromise(`${mongodumpPath} --db ${DB_NAME} --out ${tempDir}`);
          return true;
        }
      } catch (err) {
        console.log(`Failed with ${mongodumpPath}: ${err.message}`);
      }
    }
    
    throw new Error('mongodump not available');
  }
}

// Backup using MongoDB driver
async function backupWithDriver(dbDir) {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collections = await db.listCollections().toArray();
    
    console.log(`Found ${collections.length} collections`);
    
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`Backing up collection: ${collectionName}`);
      
      const docs = await db.collection(collectionName).find({}).toArray();
      const outputFile = path.join(dbDir, `${collectionName}.json`);
      
      fs.writeFileSync(outputFile, JSON.stringify(docs, null, 2));
      console.log(`Wrote ${docs.length} documents to ${outputFile}`);
    }
    
    console.log('All collections backed up successfully!');
  } catch (err) {
    console.error('Error backing up with driver:', err);
    throw err;
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Create backup stats
async function createBackupStats(statsFile) {
  console.log('Creating backup statistics...');
  
  const client = new MongoClient(MONGO_URI);
  const stats = [];
  let totalDocuments = 0;
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments();
      stats.push(`- ${collectionName}: ${count} documents`);
      totalDocuments += count;
    }
    
    const content = [
      'DATABASE BACKUP SUMMARY',
      '-----------------------------------------------------',
      `Database: ${DB_NAME}`,
      `Timestamp: ${new Date().toString()}`,
      '-----------------------------------------------------',
      'COLLECTION COUNTS:',
      ...stats,
      '-----------------------------------------------------',
      `TOTAL DOCUMENTS BACKED UP: ${totalDocuments}`,
      '-----------------------------------------------------'
    ].join('\n');
    
    fs.writeFileSync(statsFile, content);
    console.log('Backup statistics created');
    console.log(content);
  } catch (err) {
    console.error('Error creating stats:', err);
    const errorStats = [
      'DATABASE BACKUP SUMMARY',
      '-----------------------------------------------------',
      `Database: ${DB_NAME}`,
      `Timestamp: ${new Date().toString()}`,
      '-----------------------------------------------------',
      'ERROR: Could not collect statistics',
      '-----------------------------------------------------'
    ].join('\n');
    
    fs.writeFileSync(statsFile, errorStats);
  } finally {
    await client.close();
  }
}

// Clean up old backups
async function cleanupOldBackups() {
  console.log(`Cleaning up old backups, keeping the ${MAX_BACKUPS} most recent...`);
  
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('mongodb_backup_') && file.endsWith('.tar.gz'))
      .map(file => path.join(BACKUP_DIR, file))
      .map(file => ({ file, mtime: fs.statSync(file).mtime }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    
    if (files.length > MAX_BACKUPS) {
      const filesToDelete = files.slice(MAX_BACKUPS);
      for (const file of filesToDelete) {
        console.log(`Deleting old backup: ${file.file}`);
        fs.unlinkSync(file.file);
      }
    }
    
    console.log('Cleanup complete');
  } catch (err) {
    console.error('Error during cleanup:', err);
  }
}

// Run the backup
backup().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
}); 