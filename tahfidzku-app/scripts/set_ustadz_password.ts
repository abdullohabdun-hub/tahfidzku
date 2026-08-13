import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { db } from '../src/db'
import { users } from '../src/db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  const hash = bcrypt.hashSync('admin123', 10)
  await db.update(users).set({ passwordHash: hash }).where(eq(users.email, 'ustadz@demo.com'))
  console.log('✅ Updated ustadz@demo.com password to admin123!')
  process.exit(0)
}

main()
