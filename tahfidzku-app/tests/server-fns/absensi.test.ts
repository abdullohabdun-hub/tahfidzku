import { describe, it, expect, beforeEach } from 'vitest';
import { bukaSesiAbsensi } from '../../src/server-fns/absensi';
import { setupAbsensiTestFixture } from '../fixtures/absensi.fixtures';

describe('bukaSesiAbsensi (Read Path)', () => {
  let testContext: { kelasId: string; tenantId: string; santriA: string; santriB: string };

  beforeEach(async () => {
    // Setup: Kelas Senin-Rabu. Santri A (Senin-Rabu), Santri B (Jumat-Minggu)
    testContext = await setupAbsensiTestFixture();
  });

  it('returns santri yang masuk di hari sesi saja', async () => {
    // Note: requires full DB mocking / context passing to run properly
    const result = await bukaSesiAbsensi({
      kelasId: testContext.kelasId,
      tanggal: '2024-01-01', // Senin
      waktuSesi: 'pagi'
    }, { user: { tenantId: testContext.tenantId } } as any);

    expect(result.data.daftarSantri).toContainEqual(
      expect.objectContaining({ id: testContext.santriA })
    );
    expect(result.data.daftarSantri).not.toContainEqual(
      expect.objectContaining({ id: testContext.santriB })
    );
  });

  it('excludes santri yang libur', async () => {
    const result = await bukaSesiAbsensi({
      kelasId: testContext.kelasId,
      tanggal: '2024-01-05', // Jumat (santri A libur, santri B masuk)
      waktuSesi: 'sore'
    }, { user: { tenantId: testContext.tenantId } } as any);

    expect(result.data.daftarSantri).toContainEqual(
      expect.objectContaining({ id: testContext.santriB })
    );
    expect(result.data.daftarSantri).not.toContainEqual(
      expect.objectContaining({ id: testContext.santriA })
    );
  });
});
