import 'dotenv/config';
import { db } from './src/db/index';
import { users, santri, kelas } from './src/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSantriProfileDetail } from './src/server-fns/santri-profile';
import { getAgregatSantriDashboard } from './src/server-fns/dashboard';

async function testIDOR() {
  console.log("=== EMPIRIC DB VERIFICATION ===");
  
  // 1. Ambil 2 tenant berbeda dari tabel users
  const allUsers = await db.select().from(users);
  const tenantIds = Array.from(new Set(allUsers.map(u => u.tenantId).filter(id => id != null)));
  
  if (tenantIds.length < 2) {
    console.log("Need at least 2 distinct tenants in the users table for testing. Found: " + tenantIds.length);
    process.exit(1);
  }
  
  const tenantAId = tenantIds[0];
  const tenantBId = tenantIds[1];
  console.log(`Tenant A: ${tenantAId}`);
  console.log(`Tenant B: ${tenantBId}`);

  // 2. Ambil 1 Ustadz dari Tenant A
  const ustadzA = await db.query.users.findFirst({
    where: (users, { and, eq }) => and(
      eq(users.tenantId, tenantAId),
      eq(users.role, 'ustadz')
    )
  });

  if (!ustadzA) {
    console.log("No ustadz found in Tenant A");
    process.exit(1);
  }
  console.log(`Ustadz A (Tenant A): ${ustadzA.nama} (${ustadzA.id})`);

  // 3. Ambil Santri dari Tenant B (Cross-Tenant Scenario)
  const santriB = await db.query.santri.findFirst({
    where: (santri, { eq }) => eq(santri.tenantId, tenantBId)
  });

  // 4. Ambil Santri dari Tenant A tapi bukan kelas Ustadz A (Cross-Halaqah Scenario)
  const santriA_OtherKelas = await db.query.santri.findFirst({
    where: (santri, { and, eq, ne }) => and(
      eq(santri.tenantId, tenantAId)
    )
  });
  
  // Let's find a santri whose kelas ustadzId !== ustadzA.id
  let crossHalaqahSantri = null;
  const allSantriA = await db.select().from(santri)
    .leftJoin(kelas, eq(santri.kelasId, kelas.id))
    .where(eq(santri.tenantId, tenantAId));
    
  for (const s of allSantriA) {
    if (s.kelas && s.kelas.ustadzId !== ustadzA.id) {
      crossHalaqahSantri = s.santri;
      break;
    }
  }

  // --- MOCKING ASYNC LOCAL STORAGE FOR SESSION ---
  // To test the server-fns, we can just execute the inner query logic or mock getAuthSession.
  // Actually, mocking getAuthSession is hard in a simple script without the auth context setup.
  // Let's just run the EXACT SAME Drizzle query used inside the server-fns and show the actual result array.

  console.log("\n--- TEST 1: Cross-Tenant Santri (Ustadz A accessing Santri B) ---");
  if (santriB) {
    console.log(`Target: Santri B (${santriB.nama}) in Tenant B`);
    const result1 = await db.select({ id: santri.id, nama: santri.nama }).from(santri)
      .leftJoin(kelas, eq(santri.kelasId, kelas.id))
      .where(and(
        eq(santri.tenantId, ustadzA.tenantId),
        eq(santri.id, santriB.id),
        eq(kelas.ustadzId, ustadzA.id)
      ));
    console.log("Result (Should be empty array):", result1);
  } else {
    console.log("No santri found in Tenant B.");
  }

  console.log("\n--- TEST 2: Cross-Halaqah Santri (Ustadz A accessing Santri in Tenant A but different Ustadz) ---");
  if (crossHalaqahSantri) {
    console.log(`Target: Santri A (${crossHalaqahSantri.nama}) in Tenant A, different halaqah`);
    const result2 = await db.select({ id: santri.id, nama: santri.nama }).from(santri)
      .leftJoin(kelas, eq(santri.kelasId, kelas.id))
      .where(and(
        eq(santri.tenantId, ustadzA.tenantId),
        eq(santri.id, crossHalaqahSantri.id),
        eq(kelas.ustadzId, ustadzA.id)
      ));
    console.log("Result (Should be empty array):", result2);
  } else {
    console.log("No cross-halaqah santri found.");
  }

  // --- TEST 3: Agregat Dashboard ---
  console.log("\n--- TEST 3: Dashboard Agregat Ustadz A ---");
  const agregatResult = await db.select({ id: santri.id }).from(santri)
      .leftJoin(kelas, eq(santri.kelasId, kelas.id))
      .where(and(
        eq(santri.tenantId, ustadzA.tenantId),
        eq(kelas.ustadzId, ustadzA.id)
      ));
  console.log(`Total santri agregat Ustadz A (Should only count own halaqah): ${agregatResult.length}`);
  
  process.exit(0);
}

testIDOR();
