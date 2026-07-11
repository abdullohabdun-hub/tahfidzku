import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import 'dotenv/config';

async function main() {
  console.log('Running migrations...');
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: './src/db/migrations' });
  console.log('Migrations completed successfully.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
