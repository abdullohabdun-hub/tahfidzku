import { getUstadzDashboard } from './src/server-fns/dashboard';
import { db } from './src/db';
import 'dotenv/config';
async function test() {
  try {
    const res = await getUstadzDashboard();
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}
test();
