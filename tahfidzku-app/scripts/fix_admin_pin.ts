import dotenv from 'dotenv'
import path from 'path'
import bcrypt from 'bcryptjs'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function fix() {
  const { db } = await import('../src/db/index')
  const { users } = await import('../src/db/schema/index')
  const { eq } = await import('drizzle-orm')

  const hashed = await bcrypt.hash('123456', 10)
  await db.update(users).set({ passwordHash: hashed, role: 'admin' }).where(eq(users.email, 'admin@demo.com'))
  console.log('✅ admin@demo.com role set to admin & PIN set to 123456!')
  process.exit(0)
}

fix().catch(err => {
  console.error(err)
  process.exit(1)
})
