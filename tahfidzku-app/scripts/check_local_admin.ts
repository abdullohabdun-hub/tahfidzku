import { db } from '../src/db'
import { users } from '../src/db/schema'
import { eq } from 'drizzle-orm'

async function check() {
  const allUsers = await db.select({ id: users.id, email: users.email, username: users.username, role: users.role }).from(users)
  console.log('Users in DB:', allUsers)
  process.exit(0)
}

check().catch(err => {
  console.error(err)
  process.exit(1)
})
