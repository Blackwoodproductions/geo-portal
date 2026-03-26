/**
 * Remove all seed data created by prisma/seed.ts.
 * Identifies seed users by the @geoportal.com email domain,
 * then deletes their related records in FK-safe order.
 *
 * Run: npx ts-node prisma/seed-delete.ts
 */
import { PrismaClient } from '@prisma/client';

const SEED_EMAIL_DOMAIN = '@geoportal.com';

const prisma = new PrismaClient();

async function main() {
  const seedUsers = await prisma.user.findMany({
    where: { email: { endsWith: SEED_EMAIL_DOMAIN } },
    select: { id: true, email: true },
  });

  if (seedUsers.length === 0) {
    console.log('No seed users found. Nothing to delete.');
    return;
  }

  const userIds = seedUsers.map((u) => u.id);

  console.log(`Found ${seedUsers.length} seed users:`);
  seedUsers.forEach((u) => console.log(`  - ${u.email}`));

  // Get portal IDs owned by seed users
  const seedPortals = await prisma.portal.findMany({
    where: { ownerId: { in: userIds } },
    select: { id: true },
  });
  const portalIds = seedPortals.map((p) => p.id);

  // Delete in FK-safe order
  const reactions = await prisma.portalReaction.deleteMany({
    where: { portalId: { in: portalIds } },
  });
  console.log(`Deleted ${reactions.count} reactions`);

  const messages = await prisma.portalMessage.deleteMany({
    where: { portalId: { in: portalIds } },
  });
  console.log(`Deleted ${messages.count} messages`);

  const visits = await prisma.portalVisit.deleteMany({
    where: { portalId: { in: portalIds } },
  });
  console.log(`Deleted ${visits.count} visits`);

  const portals = await prisma.portal.deleteMany({
    where: { ownerId: { in: userIds } },
  });
  console.log(`Deleted ${portals.count} portals`);

  const users = await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });
  console.log(`Deleted ${users.count} users`);

  console.log('\nSeed data removed successfully.');
}

main()
  .catch((e) => {
    console.error('Failed to delete seed data:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
