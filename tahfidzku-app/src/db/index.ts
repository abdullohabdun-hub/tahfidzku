// src/db/index.ts
// Koneksi Drizzle ORM ke PostgreSQL (Neon.tech serverless)

import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// --- SAFEGUARD ENVIRONMENT PRODUKSI ---
// Jika connection string mengandung host production Neon, 
// pastikan kita BENAR-BENAR ada di environment Production (bukan Preview, bukan Lokal).
const PROD_HOST = 'ep-late-cell-aoor6dr4';
if (connectionString && connectionString.includes(PROD_HOST)) {
  const isVercelProd = process.env.VERCEL_ENV === 'production';
  const isVercelPreview = process.env.VERCEL_ENV === 'preview';
  const isBypassed = process.env.CONFIRM_PRODUCTION === 'yes';

  if (!isVercelProd && !isBypassed) {
    console.error('\n🚨 FATAL ERROR: DATABASE_URL menunjuk ke PRODUCTION!');
    if (isVercelPreview) {
      console.error('Environment ini adalah VERCEL PREVIEW, tapi terhubung ke data asli (Produksi).');
      console.error('Silakan buka Vercel Dashboard > Project Settings > Environment Variables,');
      console.error('lalu ubah DATABASE_URL untuk environment "Preview" ke branch dev Neon Anda.');
    } else {
      console.error('Anda sedang berjalan di local environment (atau build lokal) tetapi terhubung ke data asli.');
      console.error('Silakan ganti DATABASE_URL ke database dev di .env lokal Anda.');
      console.error('Jika Anda BENAR-BENAR ingin menjalankan script ke production secara lokal,');
      console.error('tambahkan prefix: CONFIRM_PRODUCTION=yes');
    }
    console.error('\n');
    process.exit(1);
  }
}
// ---------------------------------------

const pool = new Pool({ connectionString })
export const db = drizzle({ client: pool, schema })
