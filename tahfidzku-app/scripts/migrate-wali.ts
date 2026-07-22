import { config } from 'dotenv'
config()
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

async function run() {
  const sql = neon(process.env.DATABASE_URL!)
  const migrationPath = path.join(process.cwd(), 'src/db/migrations/0012_regular_zodiak.sql')
  let query = fs.readFileSync(migrationPath, 'utf8')
  
  const statements = query.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean)
  for (const statement of statements) {
    try {
      console.log('Executing:', statement)
      await (sql as any).query(statement)
    } catch (err: any) {
      console.error('Failed statement:', statement)
      console.error(err.message)
    }
  }
  console.log('Migration complete.')
}

run()
