import { config } from 'dotenv'
config()
import { db } from './src/db/index'
import { sql } from 'drizzle-orm'

async function run() {
  console.log('Running migration...')
  try {
    await db.execute(sql`ALTER TABLE "setoran" ADD COLUMN IF NOT EXISTS "is_backdated" boolean DEFAULT false NOT NULL;`)
    console.log('Migration is_backdated success!')
  } catch (err) {
    console.error('Migration failed:', err)
  }
  process.exit(0)
}
run()
