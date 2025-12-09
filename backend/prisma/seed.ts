// backend/prisma/seed.ts
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Please configure it in backend/.env or in the container env.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const DEMO_ORG_NAME = process.env.DEMO_ORG_NAME ?? 'Demo Org';
const DEMO_ORG_SLUG = process.env.DEMO_ORG_SLUG ?? 'demo-org';
const DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL ?? 'admin@demo.local';
const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD;

async function main(): Promise<void> {
  if (!DEMO_ADMIN_PASSWORD) {
    throw new Error(
      'DEMO_ADMIN_PASSWORD is not set. Define it in backend/.env before running the seed.',
    );
  }
  // Hash password (idempotent: user upsert will update the hash if it changes).
  const passwordHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 12);

  // 1) Upsert demo organization
  const organization = await prisma.organization.upsert({
    where: {
      slug: DEMO_ORG_SLUG,
    },
    update: {
      name: DEMO_ORG_NAME,
      isActive: true,
    },
    create: {
      name: DEMO_ORG_NAME,
      slug: DEMO_ORG_SLUG,
      isActive: true,
    },
  });

  // 2) Upsert admin user
  const adminUser = await prisma.user.upsert({
    where: {
      email: DEMO_ADMIN_EMAIL,
    },
    update: {
      fullName: 'Demo Admin',
      passwordHash,
      role: 'admin',
      isActive: true,
    },
    create: {
      email: DEMO_ADMIN_EMAIL,
      fullName: 'Demo Admin',
      passwordHash,
      role: 'admin',
      isActive: true,
    },
  });

  // 3) Upsert membership in organization_users (orgRole admin + isDefault true)
  await prisma.organizationUser.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: adminUser.id,
      },
    },
    update: {
      orgRole: 'admin',
      isDefault: true,
    },
    create: {
      organizationId: organization.id,
      userId: adminUser.id,
      orgRole: 'admin',
      isDefault: true,
    },
  });

  // eslint-disable-next-line no-console
  console.log('[seed] Demo data ready:');
  // eslint-disable-next-line no-console
  console.log(`  Organization: ${DEMO_ORG_NAME} (slug: ${DEMO_ORG_SLUG})`);
  // eslint-disable-next-line no-console
  console.log(
    `  Admin user: ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD} (override with DEMO_* env vars)`,
  );
}

main()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('[seed] Completed successfully.');
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('[seed] Error during seed execution:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
