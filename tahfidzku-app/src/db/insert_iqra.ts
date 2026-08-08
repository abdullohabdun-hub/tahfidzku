import { db } from './index';
import { santri } from './schema';

async function seedIqraSantri() {
  try {
    console.log('Inserting dummy Iqra santri...');
    const dummyId = crypto.randomUUID();
    
    await db.insert(santri).values({
      id: dummyId,
      nama: 'Aisyah Iqra',
      tipe: 'reguler', // reguler or dewasa
      tahapSantri: 'iqra', // iqra or tahfidz
      jilidIqraTerakhir: 3,
      halamanIqraTerakhir: 15,
      tenantId: '6c3da655-57ab-4c7b-af0a-eae84c891ffa' // Assumed to be the default tenant id based on previous errors
    });
    
    console.log(`Successfully inserted dummy Iqra santri with ID: ${dummyId}`);
    process.exit(0);
  } catch (error) {
    console.error('Error inserting dummy Iqra santri:', error);
    process.exit(1);
  }
}

seedIqraSantri();
