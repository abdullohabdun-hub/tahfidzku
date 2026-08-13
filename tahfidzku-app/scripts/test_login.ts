import 'dotenv/config'
import bcrypt from 'bcryptjs'

const hash = '$2b$10$fnYswCXjlTSdoOSSpteK5eC.22T3RkiW4YGhg4sOKT7LkNKf5nW5u'

console.log('Testing password123:', bcrypt.compareSync('password123', hash))
console.log('Testing admin123:', bcrypt.compareSync('admin123', hash))
console.log('Testing demo123:', bcrypt.compareSync('demo123', hash))
console.log('Testing ustadz123:', bcrypt.compareSync('ustadz123', hash))
