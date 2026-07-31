require('dotenv').config({ path: '.env.production' });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Connected to Production Database.');
    
    const migrationFile = path.join(__dirname, 'src/db/migrations/0021_breezy_blindfold.sql');
    const sqlContent = fs.readFileSync(migrationFile, 'utf8');
    
    // Split by drizzle statement breakpoints
    const statements = sqlContent.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);
    
    console.log(`Found ${statements.length} statements to execute.`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`\nExecuting Statement ${i + 1}/${statements.length}...`);
      console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));
      
      try {
        await client.query(stmt);
        console.log(`✅ Statement ${i + 1} SUCCESS.`);
      } catch (err) {
        console.error(`❌ Statement ${i + 1} FAILED:`, err.message);
        console.error('FAIL-FAST: Stopping migration immediately.');
        process.exit(1);
      }
    }
    
    console.log('\n🎉 All migration statements executed successfully on PRODUCTION!');
    
  } catch (err) {
    console.error('Connection or Setup Error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
