import * as dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config({ path: '.env.production' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  try {
    const res = await pool.query(`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'status_absensi';`)
    console.log('Production status_absensi enum:', res.rows.map(r => r.enumlabel))
  } catch (err) {
    console.error(err)
  } finally {
    process.exit(0)
  }
}
main()
