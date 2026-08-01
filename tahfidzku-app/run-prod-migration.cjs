require('dotenv').config({ path: '.env.production' });
const { execSync } = require('child_process');

console.log('Starting Production Database Migration using Drizzle...');

try {
  // Execute the robust Drizzle migrate.ts script but pass the Production DATABASE_URL
  execSync('npx tsx src/db/migrate.ts', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL
    }
  });
  console.log('\n🎉 Production Migration Completed Successfully!');
} catch (error) {
  console.error('\n❌ Production Migration Failed.');
  process.exit(1);
}
