import { db } from './src/db/index';
import { santri, kelas, setoran } from './src/db/schema';
import { and, eq, gte } from 'drizzle-orm';

async function verify() {
  console.log("=== VERIFICATION SCRIPT RUNNING ===");

  const tenantId = 'dummy-tenant-id';
  const ustadzId = 'dummy-ustadz-id';
  
  // 1. Ustadz Ownership Scoping in Dashboard
  const isUstadz = true;
  console.log("\n--- Query Ownership Scoping (Ustadz) ---");
  const queryUstadz = db.select({
    id: santri.id,
    kelasId: santri.kelasId,
  }).from(santri)
    .leftJoin(kelas, eq(santri.kelasId, kelas.id))
    .where(and(
      eq(santri.tenantId, tenantId),
      isUstadz ? eq(kelas.ustadzId, ustadzId) : undefined
    )).toSQL();

  console.log("SQL:", queryUstadz.sql);
  console.log("PARAMS:", queryUstadz.params);

  // 2. IDOR role santri verification in santri-profile
  console.log("\n--- Query Santri Profile IDOR Check ---");
  const targetSantriId = 'target-santri-id';
  
  // ustadz checks ownership
  const querySantriProfileUstadz = db.select({
    id: santri.id,
    nama: santri.nama,
  }).from(santri)
    .leftJoin(kelas, eq(santri.kelasId, kelas.id))
    .where(and(
      eq(santri.tenantId, tenantId),
      eq(santri.id, targetSantriId),
      isUstadz ? eq(kelas.ustadzId, ustadzId) : undefined
    )).toSQL();

  console.log("SQL (Ustadz Context):", querySantriProfileUstadz.sql);
  console.log("PARAMS:", querySantriProfileUstadz.params);

  // admin checks without ownership scoping
  const isAdmin = true;
  const isUstadzNow = false;
  const querySantriProfileAdmin = db.select({
    id: santri.id,
    nama: santri.nama,
  }).from(santri)
    .leftJoin(kelas, eq(santri.kelasId, kelas.id))
    .where(and(
      eq(santri.tenantId, tenantId),
      eq(santri.id, targetSantriId),
      isUstadzNow ? eq(kelas.ustadzId, ustadzId) : undefined
    )).toSQL();

  console.log("\nSQL (Admin Context):", querySantriProfileAdmin.sql);
  console.log("PARAMS:", querySantriProfileAdmin.params);
  
  process.exit(0);
}

verify();
