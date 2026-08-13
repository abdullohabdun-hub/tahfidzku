import 'dotenv/config'
import { db } from '../src/db'
import { users } from '../src/db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  const list = await db.select().from(users).where(eq(users.role, 'ustadz'))
  console.log('Ustadz list:', list.map(u => ({ email: u.email, nama: u.nama })))
  process.exit(0)
}

main()
