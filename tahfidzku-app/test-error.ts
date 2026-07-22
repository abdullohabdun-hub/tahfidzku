import { config } from 'dotenv'
config()
import { z } from 'zod'
import { db } from './src/db/index'
import { santri } from './src/db/schema/index'
import { like } from 'drizzle-orm'

async function run() {
  const s = await db.select().from(santri).where(like(santri.nama, '%Hendri%')).limit(1)
  if (!s[0]) return console.log('Hendri not found');
  
  const payload = {
    id: s[0].id,
    nama: 'Hendri Edit',
    targetJuz: 30,
    juzProgress: [30, 29, 28],
    tipe: 'dewasa',
    username: 'hendri@test.com'
  }
  
  try {
    // We can't easily test the createServerFn directly without mocking the session.
    // Instead, I'll reproduce the Zod parsing manually.
    console.log("Zod parse test...");
    const schema = z.object({
      id: z.string(),
      nama: z.string().min(1, 'Nama santri wajib diisi'),
      targetJuz: z.number().min(1).max(30),
      juzProgress: z.array(z.number().int().min(1).max(30)).transform(val => Array.from(new Set(val))).default([]),
      batasHafalanJuz: z.number().optional().nullable(),
      batasHafalanSurah: z.string().optional().nullable(),
      batasHafalanAyat: z.number().optional().nullable(),
      kelasId: z.string().optional().nullable(),
      tipe: z.enum(['reguler', 'dewasa']).default('dewasa'),
      username: z.string().optional(),
      password: z.string().optional()
    });
    
    const parsed = schema.parse(payload);
    console.log("Parsed OK:", parsed);
  } catch (err: any) {
    console.error("ZOD ERROR:", err.errors || err.message);
  }

  // Let's manually run the transaction code block to simulate it:
  try {
    const data = payload as any;

    
    // Guard
    if (s[0].posisiTerakhir !== null && s[0].posisiTerakhir !== undefined) {
      data.juzProgress = s[0].juzProgress || []
    }
  } catch (err) {
    console.error("Transaction Error:", err);
  }
}

run();
