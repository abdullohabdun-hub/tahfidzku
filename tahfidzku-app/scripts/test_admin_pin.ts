import dotenv from 'dotenv'
import path from 'path'
import bcrypt from 'bcryptjs'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function check() {
  const { db } = await import('../src/db/index')
  const { users } = await import('../src/db/schema/index')
  const allUsers = await db.select().from(users)
  for (const u of allUsers) {
    const is123456 = await bcrypt.compare('123456', u.passwordHash)
    console.log(`User: ${u.email || u.username} | Role: ${u.role} | PIN '123456' valid: ${is123456}`)
  }
  process.exit(0)
}

check().catch(err => {
  console.error(err)
  process.exit(1)
})
