import 'dotenv/config';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { db } from './index.js';

async function main() {
  console.log('Running migrations...');
  try {
    await migrate(db, { migrationsFolder: 'src/db/migrations' });
    console.log('Migrations applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}
main();
