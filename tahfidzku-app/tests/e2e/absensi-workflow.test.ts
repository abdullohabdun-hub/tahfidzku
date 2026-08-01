import { describe, it, expect, beforeEach } from 'vitest';
import { simpanAbsensi, bukaSesiAbsensi } from '../../src/server-fns/absensi';
import { setupE2EScenario } from '../fixtures/absensi.fixtures';

describe('E2E: Absensi Workflow dengan hariMasuk', () => {
  let scenario: {
    tenant: string;
    kelas: string;
    santriA: { id: string; hariMasuk: string[] };
    santriB: { id: string; hariMasuk: string[] };
  };

  beforeEach(async () => {
    scenario = await setupE2EScenario();
  });

  it('workflow: bukaSesiAbsensi → tampil santri tepat → simpanAbsensi valid', async () => {
    // Note: requires full DB mocking / context passing to run properly
    const sesi = await bukaSesiAbsensi({
      kelasId: scenario.kelas,
      tanggal: '2024-01-01', // Senin
      waktuSesi: 'pagi'
    }, { user: { tenantId: scenario.tenant } } as any);

    expect(sesi.data.daftarSantri).toHaveLength(1);
    expect(sesi.data.daftarSantri[0].id).toBe(scenario.santriA.id);

    const result = await simpanAbsensi({
      sesiKelasId: sesi.data.sesiId,
      daftarStatus: [
        { santriId: scenario.santriA.id, status: 'hadir' }
      ]
    }, { user: { tenantId: scenario.tenant } } as any);

    expect(result.data).toBeNull();
    expect(result.message).toBe('Berhasil menyimpan absensi');
  });

  it('workflow protection: tidak bisa masukkan santri libur via direct API', async () => {
    await expect(simpanAbsensi({
      sesiKelasId: 'sesi-senin-123',
      daftarStatus: [
        { santriId: scenario.santriB.id, status: 'hadir' }
      ]
    }, { user: { tenantId: scenario.tenant } } as any))
      .rejects.toThrow('tidak sah untuk sesi ini');
  });
});
