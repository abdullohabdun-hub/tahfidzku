import { db } from '../src/db'
import { setoran } from '../src/db/schema'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  try {
    console.log('Deleting all setoran data...')
    await db.delete(setoran)
    console.log('Successfully deleted all setoran data.')
  } catch (err) {
    console.error('Failed:', err)
  }
  process.exit(0)
}

main()
