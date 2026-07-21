import { db } from '../src/db'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  try {
    console.log('Migrating billing_action ENUM...')
    
    // Check existing enum values
    const checkEnum = await db.execute(sql`
      SELECT unnest(enum_range(NULL::billing_action))::text AS action
    `)
    
    const existingActions = checkEnum.rows.map((r: any) => r.action)
    console.log('Existing actions:', existingActions)
    
    if (!existingActions.includes('approve')) {
      console.log('Adding "approve" to billing_action...')
      await db.execute(sql`ALTER TYPE billing_action ADD VALUE 'approve'`)
    }
    
    if (!existingActions.includes('reject')) {
      console.log('Adding "reject" to billing_action...')
      await db.execute(sql`ALTER TYPE billing_action ADD VALUE 'reject'`)
    }

    console.log('Migration completed successfully!')
  } catch (err) {
    console.error('Migration failed:', err)
  }
  process.exit(0)
}

main()
