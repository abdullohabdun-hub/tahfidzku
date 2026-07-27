import { AuthenticationError } from '../src/lib/errors'
import { handleError } from '../src/lib/response'

const err = new AuthenticationError('Akses ditolak')
console.log('Error instance:', err)
console.log('instanceof Error?', err instanceof Error)
console.log('code in err?', 'code' in err)
console.log('Result from handleError:', handleError(err))
