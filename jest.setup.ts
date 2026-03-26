import dotenv from 'dotenv';
import path from 'path';

// Load test environment before anything else
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

import { resetStore } from '@/lib/rateLimit';
import { prisma } from '@/lib/db';

afterEach(() => {
  resetStore();
});

afterAll(async () => {
  // Clean up all test data in FK-safe order
  await prisma.portalReaction.deleteMany();
  await prisma.portalMessage.deleteMany();
  await prisma.portalVisit.deleteMany();
  await prisma.portal.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});
