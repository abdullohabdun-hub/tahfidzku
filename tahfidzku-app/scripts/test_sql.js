require('dotenv/config');
const { db } = require('../src/db');
const { sql } = require('drizzle-orm');

async function testQuery() {
  try {
    const tenantId = '11111111-1111-1111-1111-111111111111'; // dummy
    const ustadzId = '22222222-2222-2222-2222-222222222222'; // dummy
    const programFilter = sql`1=1`;
    
    const santriBinaanData = await db.execute(sql`
        SELECT s.id, s.nama, s.juz_terakhir, s.tahap_santri, s.jilid_iqra_terakhir
        FROM santri s
        JOIN kelas k ON s.kelas_id = k.id
        WHERE s.tenant_id = ${tenantId} AND k.ustadz_id = ${ustadzId} AND ${programFilter}
      `);
      
    console.log("Success:", santriBinaanData.rows);
  } catch(e) {
    console.error("SQL Error:", e.message);
  }
  process.exit(0);
}

testQuery();
