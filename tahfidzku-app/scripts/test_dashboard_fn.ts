import { getAdminDashboardStats } from '../src/server-fns/dashboard'

async function test() {
  try {
    console.log('Testing getAdminDashboardStats...')
    // Note: getAdminDashboardStats checks session via getAuthSession()
    // Let's run and see if it throws or succeeds
    const result = await getAdminDashboardStats()
    console.log('Result:', JSON.stringify(result, null, 2))
  } catch (err: any) {
    console.error('Error during test:', err)
  }
}

test()
