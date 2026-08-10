// src/db/index.ts
// Koneksi Drizzle ORM ke PostgreSQL (Neon.tech serverless)

import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// --- SAFEGUARD ENVIRONMENT PRODUKSI ---
// Safeguard ini HANYA berjalan saat development lokal untuk mencegah lokal dev tidak sengaja menyentuh DB produksi.
if (process.env.NODE_ENV !== 'production') {
  const PROD_HOST = 'ep-twilight-feather-ao5fmi2r';
  if (connectionString && connectionString.includes(PROD_HOST)) {
    const isBypassed = process.env.CONFIRM_PRODUCTION === 'yes';

    if (!isBypassed) {
      console.error('\n🚨 FATAL ERROR: DATABASE_URL lokal menunjuk ke DB PRODUCTION!');
      console.error('Silakan ganti DATABASE_URL ke database dev di .env lokal Anda, atau gunakan CONFIRM_PRODUCTION=yes.\n');
      process.exit(1);
    }
  }
}
// ---------------------------------------

const pool = new Pool({ connectionString })
export const db = drizzle({ client: pool, schema })
