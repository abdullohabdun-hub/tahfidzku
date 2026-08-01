import { db } from '../db/index';
import { santri } from '../db/schema/index';
import { and, eq, sql } from 'drizzle-orm';
import { parseDateString } from './dateUtils';

const HARI_BY_GETDAY = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'] as const;

export function getHariFromTanggal(tanggal: string | Date): (typeof HARI_BY_GETDAY)[number] {
  const date = typeof tanggal === 'string' ? parseDateString(tanggal) : tanggal;
  return HARI_BY_GETDAY[date.getDay()];
}

/**
 * Mendapatkan set ID santri yang valid untuk sesi absensi tertentu.
 * Validasi:
 * 1. Santri terdaftar di kelas sesi
 * 2. Santri milik tenant yang sama
 * 3. Hari sesi termasuk dalam hariMasuk santri
 */
export async function getSantriValidIdForSession({
  kelasId,
  tenantId,
  hariSesi,
}: {
  kelasId: string;
  tenantId: string;
  hariSesi: (typeof HARI_BY_GETDAY)[number];
}): Promise<Set<string>> {
  const rows = await db
    .select({ id: santri.id })
    .from(santri)
    .where(
      and(
        eq(santri.kelasId, kelasId),
        eq(santri.tenantId, tenantId),
        sql`${hariSesi} = ANY(${santri.hariMasuk})`
      )
    );
  return new Set(rows.map((r) => r.id));
}
