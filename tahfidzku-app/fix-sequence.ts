import { config } from 'dotenv'
config()

import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })

async function main() {
  console.log('Fixing sequence for __drizzle_migrations...')
  try {
    const res = await pool.query(`
      SELECT setval(
        pg_get_serial_sequence('drizzle.__drizzle_migrations', 'id'), 
        COALESCE((SELECT MAX(id) FROM drizzle.__drizzle_migrations), 1)
      );
    `)
    console.log('Sequence updated:', res.rows)
  } catch (e) {
    console.error('Failed to update sequence:', e)
  }
  await pool.end()
}

main()
