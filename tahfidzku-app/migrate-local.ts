import { config } from 'dotenv'
config()
import { db } from './src/db/index'
import { sql } from 'drizzle-orm'

async function run() {
  console.log('Running migration...')
  try {
    // Add columns without NOT NULL first
    await db.execute(sql`ALTER TABLE "setoran" ADD COLUMN IF NOT EXISTS "tanggal_setoran" date;`)
    await db.execute(sql`UPDATE "setoran" SET "tanggal_setoran" = ("created_at" AT TIME ZONE 'Asia/Jakarta')::date WHERE "tanggal_setoran" IS NULL;`)
    await db.execute(sql`ALTER TABLE "setoran" ALTER COLUMN "tanggal_setoran" SET NOT NULL;`)
    console.log('Migration setoran success!')
    
    await db.execute(sql`ALTER TABLE "setoran_iqra" ADD COLUMN IF NOT EXISTS "tanggal_setoran" date;`)
    await db.execute(sql`UPDATE "setoran_iqra" SET "tanggal_setoran" = ("created_at" AT TIME ZONE 'Asia/Jakarta')::date WHERE "tanggal_setoran" IS NULL;`)
    await db.execute(sql`ALTER TABLE "setoran_iqra" ALTER COLUMN "tanggal_setoran" SET NOT NULL;`)
    console.log('Migration setoran_iqra success!')
  } catch (err) {
    console.error('Migration failed:', err)
  }
  process.exit(0)
}
run()
