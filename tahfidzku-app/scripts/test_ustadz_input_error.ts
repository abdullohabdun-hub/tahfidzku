import 'dotenv/config'
import { getSantriList } from '../src/server-fns/santri'

async function main() {
  // We can't easily mock the session for createServerFn without a real request context
  // But let's see what happens if we call it outside of the HTTP context
  try {
    const res = await getSantriList({ data: undefined })
    console.log(JSON.stringify(res, null, 2))
  } catch (err) {
    console.error("Caught error:", err)
  }
}

main()
