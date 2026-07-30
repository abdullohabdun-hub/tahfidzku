import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Client } from 'pg';

async function runMigration() {
  const args = process.argv.slice(2);
  const targetEnvFile = args.find(a => a.startsWith('--env='))?.split('=')[1] || (args.includes('--prod') ? '.env.production' : '.env');
  const migrationFilePath = args.find(a => !a.startsWith('--'));

  if (!migrationFilePath) {
    console.error('Penggunaan: npx tsx scripts/run-migration.ts <file_migrasi.sql> [--prod atau --env=.env.production]');
    process.exit(1);
  }

  // Load environment variables dari file target
  const envPath = path.resolve(process.cwd(), targetEnvFile);
  const config = dotenv.config({ path: envPath }).parsed || {};
  let dbUrl = config.DATABASE_URL || process.env.DATABASE_URL;

  if (dbUrl) dbUrl = dbUrl.replace(/^["']|["']$/g, '');

  if (!dbUrl) {
    console.error(`❌ ERROR: DATABASE_URL tidak ditemukan di file ${targetEnvFile}`);
    process.exit(1);
  }

  // Safeguard bila menunjuk ke production
  const PROD_HOST = 'ep-twilight-feather-ao5fmi2r';
  const isProdHost = dbUrl.includes(PROD_HOST);
  const isBypassed = process.env.CONFIRM_PRODUCTION === 'yes';

  if (isProdHost && !isBypassed) {
    console.error('\n🚨 FATAL ERROR: DATABASE_URL menunjuk ke PRODUCTION!');
    console.error('Gunakan prefix: $env:CONFIRM_PRODUCTION="yes" jika benar-benar ingin menjalankan ke production.');
    process.exit(1);
  }

  console.log(`\n=== JALANKAN MIGRASI ===`);
  console.log(`Target File ENV : ${targetEnvFile}`);
  console.log(`Target Database : ${isProdHost ? 'PRODUCTION (' + PROD_HOST + ')' : 'DEVELOPMENT'}`);
  console.log(`File Migrasi    : ${migrationFilePath}\n`);

  const fileContent = fs.readFileSync(migrationFilePath, 'utf8');
  const statements = fileContent.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`Executing statement [${i + 1}/${statements.length}]:`, stmt.substring(0, 60).replace(/\n/g, ' ') + '...');
    try {
      await client.query(stmt);
      console.log('✅ Success');
    } catch (e: any) {
      const msg = e.message || '';
      const code = e.code || '';
      // Safe skip untuk objek/kolom/tipe yang sudah ada
      if (
        msg.includes('already exists') ||
        code === '42710' || // duplicate_object (enum/type)
        code === '42701' || // duplicate_column
        code === '42P07'    // duplicate_table
      ) {
        console.log(`⚠️ Skip: ${msg.split('\n')[0]}`);
      } else {
        console.error(`❌ FATAL ERROR pada statement [${i + 1}/${statements.length}]:`);
        console.error(msg);
        console.error('MIGRATION HALTED.');
        await client.end();
        process.exit(1); // FAIL FAST
      }
    }
  }

  await client.end();
  console.log('\n🎉 Migrasi selesai dengan sukses!\n');
  process.exit(0);
}

runMigration().catch(e => {
  console.error('Script gagal:', e);
  process.exit(1);
});
