const { execSync } = require('child_process');

console.log('Starting data export and git push process...');

try {
  // Export all data
  console.log('\n--- Exporting all data ---');
  execSync('npm run export:all', { stdio: 'inherit' });

  // Git add the exported files
  console.log('\n--- Adding files to git ---');
  execSync('git add server/src/data/seeds/countries.ts server/src/data/seeds/bollards-data.ts server/src/data/seeds/plates-data.ts', { stdio: 'inherit' });

  // Git commit
  console.log('\n--- Committing changes ---');
  execSync('git commit -m "Update seed data from local database"', { stdio: 'inherit' });

  // Git push
  console.log('\n--- Pushing to GitHub ---');
  execSync('git push', { stdio: 'inherit' });

  console.log('\nProcess completed successfully!');
} catch (error) {
  console.error('\nError during export and push process:', error.message);
  process.exit(1);
} 