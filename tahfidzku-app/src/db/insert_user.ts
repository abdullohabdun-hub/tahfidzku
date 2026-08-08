import { db } from './index';
import { users } from './schema';

async function seedUser() {
  try {
    console.log('Inserting dummy user for Iqra santri...');
    
    await db.insert(users).values({
      tenantId: '6c3da655-57ab-4c7b-af0a-eae84c891ffa',
      nama: 'Aisyah Iqra',
      username: 'aisyah',
      passwordHash: '123456',
      role: 'santri',
      santriId: 'ee3a960e-772a-44b3-b1b3-8767267220e5'
    });
    
    console.log('Successfully inserted dummy user for Iqra santri');
    process.exit(0);
  } catch (error) {
    console.error('Error inserting dummy user:', error);
    process.exit(1);
  }
}

seedUser();
