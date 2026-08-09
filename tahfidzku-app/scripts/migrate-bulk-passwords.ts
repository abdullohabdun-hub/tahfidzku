import 'dotenv/config';
import { db } from '../src/db/index';
import { users } from '../src/db/schema';
import { inArray, eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

interface MigrationOptions {
  dryRun: boolean;
  targetIds?: string[];
  limit?: number;
}

export async function runBulkPasswordMigration(options: MigrationOptions) {
  console.log('════════════════════════════════════════════════════════════');
  console.log(`  BULK BCRYPT PASSWORD MIGRATION SCRIPT`);
  console.log(`  MODE: ${options.dryRun ? 'DRY-RUN (READ-ONLY SIMULATION)' : '🔴 EXECUTE (WRITING TO DB)'}`);
  if (options.targetIds && options.targetIds.length > 0) {
    console.log(`  TARGET IDS (${options.targetIds.length}): ${options.targetIds.join(', ')}`);
  }
  if (options.limit) {
    console.log(`  LIMIT: ${options.limit} accounts`);
  }
  console.log('════════════════════════════════════════════════════════════\n');

  // Fetch all candidate users
  const allUsers = await db.select({
    id: users.id,
    nama: users.nama,
    username: users.username,
    email: users.email,
    noWa: users.noWa,
    role: users.role,
    passwordHash: users.passwordHash,
    tenantId: users.tenantId
  }).from(users);

  // Filter candidates whose passwordHash is NOT bcrypt ($2a$ or $2b$)
  let candidateUsers = allUsers.filter(u => 
    !u.passwordHash.startsWith('$2a$') && !u.passwordHash.startsWith('$2b$')
  );

  // Filter by targetIds if specified (for Pilot mode)
  if (options.targetIds && options.targetIds.length > 0) {
    candidateUsers = candidateUsers.filter(u => options.targetIds!.includes(u.id));
  }

  // Apply limit if specified
  if (options.limit && options.limit > 0) {
    candidateUsers = candidateUsers.slice(0, options.limit);
  }

  console.log(`FOUND ${candidateUsers.length} CANDIDATE ACCOUNTS TO PROCESS.\n`);

  if (candidateUsers.length === 0) {
    console.log('No eligible plaintext accounts found. Migration complete or no targets match.');
    return { processedCount: 0, updatedUsers: [] };
  }

  const updatesPayload: { id: string; nama: string; role: string; oldPattern: string; newHash: string }[] = [];

  for (let i = 0; i < candidateUsers.length; i++) {
    const user = candidateUsers[i];
    const newHash = await bcrypt.hash(user.passwordHash, 10);
    updatesPayload.push({
      id: user.id,
      nama: user.nama,
      role: user.role,
      oldPattern: user.passwordHash,
      newHash
    });

    console.log(`[${i + 1}/${candidateUsers.length}] User: ${user.nama} (${user.email || user.username || user.noWa || user.id})`);
    console.log(`    Before (Plaintext Pattern): "${user.passwordHash}"`);
    console.log(`    After (Bcrypt Hash Generated): "${newHash.substring(0, 15)}..."`);
  }

  if (options.dryRun) {
    console.log('\n------------------------------------------------------------');
    console.log(`[DRY-RUN SUMMARY] ${updatesPayload.length} accounts would be updated.`);
    console.log(`NO CHANGES WRITTEN TO DATABASE (DRY-RUN MODE ACTIVE).`);
    console.log('------------------------------------------------------------\n');
    return { processedCount: updatesPayload.length, updatedUsers: updatesPayload };
  }

  // EXECUTE MODE: Write to database
  console.log('\n------------------------------------------------------------');
  console.log(`🔴 EXECUTING DATABASE UPDATES FOR ${updatesPayload.length} ACCOUNTS...`);
  console.log('------------------------------------------------------------');

  const updatedResults = [];
  for (const item of updatesPayload) {
    const [res] = await db
      .update(users)
      .set({ passwordHash: item.newHash })
      .where(eq(users.id, item.id))
      .returning({
        id: users.id,
        nama: users.nama,
        role: users.role,
        passwordHash: users.passwordHash
      });
    updatedResults.push(res);
  }

  console.log(`SUCCESSFULLY UPDATED ${updatedResults.length} ACCOUNTS IN DATABASE.`);
  return { processedCount: updatedResults.length, updatedUsers: updatedResults };
}

// CLI Execution handler
if (process.argv[1]?.includes('migrate-bulk-passwords')) {
  const isExecute = process.argv.includes('--execute');
  const idsArg = process.argv.find(arg => arg.startsWith('--ids='));
  const limitArg = process.argv.find(arg => arg.startsWith('--limit='));

  const targetIds = idsArg ? idsArg.replace('--ids=', '').split(',') : undefined;
  const limit = limitArg ? parseInt(limitArg.replace('--limit=', ''), 10) : undefined;

  runBulkPasswordMigration({
    dryRun: !isExecute,
    targetIds,
    limit
  }).catch(console.error);
}
