import { db } from '../src/db/index';
import { tenants, users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
// import crypto from 'crypto';
import bcrypt from 'bcryptjs';

async function setupSystemTenant() {
  try {
    console.log('Checking for _system tenant...');
    let systemTenant = await db.query.tenants.findFirst({
      where: eq(tenants.slug, '_system')
    });

    if (!systemTenant) {
      console.log('Creating _system tenant...');
      const [newTenant] = await db.insert(tenants).values({
        namaLembaga: 'System',
        slug: '_system'
      }).returning();
      systemTenant = newTenant;
    }

    console.log('Checking for superadmin user...');
    let superAdmin = await db.query.users.findFirst({
      where: eq(users.username, 'superadmin')
    });

    if (!superAdmin) {
      console.log('Creating superadmin user...');
      const passwordHash = await bcrypt.hash('superadmin123', 10);
      const [newUser] = await db.insert(users).values({
        tenantId: systemTenant.id,
        nama: 'Super Admin',
        username: 'superadmin',
        email: 'superadmin@system.local',
        passwordHash,
        role: 'admin' // We use 'admin' here because 'superadmin' role doesn't exist in the enum, and the middleware will bypass based on ID anyway
      }).returning();
      superAdmin = newUser;
    }

    console.log('SUPERADMIN_USER_ID=' + superAdmin.id);

    // Read .env file and append if not exists
    const fs = require('fs');
    let envContent = fs.readFileSync('.env', 'utf8');
    if (!envContent.includes('SUPERADMIN_USER_ID')) {
      envContent += '\\nSUPERADMIN_USER_ID=""\\n';
      fs.writeFileSync('.env', envContent);
      console.log('Appended SUPERADMIN_USER_ID to .env');
    } else {
      console.log('SUPERADMIN_USER_ID already exists in .env. Please update it manually if needed.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupSystemTenant();
