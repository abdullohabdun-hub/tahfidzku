import { db } from '../src/db'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  try {
    console.log('Migrating tenant_status ENUM...')
    
    // Check existing enum values
    const checkEnum = await db.execute(sql`
      SELECT unnest(enum_range(NULL::tenant_status))::text AS status
    `)
    
    const existingStatuses = checkEnum.rows.map((r: any) => r.status)
    console.log('Existing statuses:', existingStatuses)
    
    if (!existingStatuses.includes('pending')) {
      console.log('Adding "pending" to tenant_status...')
      await db.execute(sql`ALTER TYPE tenant_status ADD VALUE 'pending' BEFORE 'trial'`)
    } else {
      console.log('"pending" already exists.')
    }
    
    if (!existingStatuses.includes('rejected')) {
      console.log('Adding "rejected" to tenant_status...')
      await db.execute(sql`ALTER TYPE tenant_status ADD VALUE 'rejected'`)
    } else {
      console.log('"rejected" already exists.')
    }

    console.log('Migration completed successfully!')
  } catch (err) {
    console.error('Migration failed:', err)
  }
  process.exit(0)
}

main()
