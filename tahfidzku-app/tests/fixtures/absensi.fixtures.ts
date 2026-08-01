export async function setupAbsensiTestFixture() {
  return {
    kelasId: 'kelas-123',
    tenantId: 'tenant-456',
    santriA: 'santri-A',
    santriB: 'santri-B'
  };
}

export async function setupAbsensiSecurityFixture() {
  return {
    kelasId: 'kelas-123',
    tenantId: 'tenant-456',
    santriA: 'santri-A',
    santriOther: 'santri-OTHER'
  };
}

export async function setupSantriValidationFixture() {
  return {
    kelasId: 'kelas-123',
    tenantId: 'tenant-456',
    minHariMasukSantri: 2,
    kelasHariPertemuan: ['senin', 'selasa', 'rabu']
  };
}

export async function setupE2EScenario() {
  return {
    tenant: 'tenant-456',
    kelas: 'kelas-123',
    santriA: { id: 'santri-A', hariMasuk: ['senin', 'selasa', 'rabu'] },
    santriB: { id: 'santri-B', hariMasuk: ['jumat', 'sabtu', 'minggu'] }
  };
}
