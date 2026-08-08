import { db } from './src/db/index.js';
import { kelas } from './src/db/schema/kelas.js';
import { eq, and, sql } from 'drizzle-orm';

async function run() {
  const res = await db.select({
    id: kelas.id,
    nama: kelas.nama,
    tipeKelas: kelas.tipeKelas,
    hariPertemuan: kelas.hariPertemuan
  })
  .from(kelas)
  .where(
    and(
      eq(kelas.tipeKelas, 'reguler_non_mukim'),
      sql`cardinality(${kelas.hariPertemuan}) = 0`
    )
  );
  
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}

run();
