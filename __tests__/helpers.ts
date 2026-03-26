import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { signToken, hashPassword } from '@/lib/auth';
import { resetStore } from '@/lib/rateLimit';

export { resetStore };

let userCounter = 0;

/**
 * Create a test user directly in the database and return auth cookie.
 */
export async function createTestUser(
  emailOverride?: string,
  password = 'testpass123'
): Promise<{ user: { id: string; email: string; displayName: string | null }; cookie: string }> {
  userCounter++;
  const email = emailOverride || `testuser${userCounter}-${Date.now()}@test.com`;
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, passwordHash, displayName: `Test User ${userCounter}` },
  });

  const token = signToken(user.id, user.tokenVersion);
  const cookie = `geo_portal_token=${token}`;

  return {
    user: { id: user.id, email: user.email, displayName: user.displayName },
    cookie,
  };
}

/**
 * Create a test portal directly in the database.
 */
export async function createTestPortal(ownerId: string, overrides: Record<string, any> = {}) {
  return prisma.portal.create({
    data: {
      ownerId,
      name: overrides.name || `Test Portal ${Date.now()}`,
      description: overrides.description || 'A test portal',
      latitude: overrides.latitude ?? 40.7128,
      longitude: overrides.longitude ?? -74.006,
      category: overrides.category || 'general',
      isPublic: overrides.isPublic ?? true,
      isActive: overrides.isActive ?? true,
      ...overrides,
    },
  });
}

/**
 * Build a NextRequest with optional auth cookie and body.
 */
export function buildRequest(
  url: string,
  options: {
    method?: string;
    cookie?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', cookie, body, headers = {} } = options;

  const allHeaders: Record<string, string> = { ...headers };
  if (cookie) allHeaders['cookie'] = cookie;
  if (body && method !== 'GET') allHeaders['content-type'] = 'application/json';

  const init: RequestInit = {
    method,
    headers: allHeaders,
  };

  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

/**
 * Clean all test data from the database.
 */
export async function cleanDatabase() {
  await prisma.portalReaction.deleteMany();
  await prisma.portalMessage.deleteMany();
  await prisma.portalVisit.deleteMany();
  await prisma.portal.deleteMany();
  await prisma.user.deleteMany();
}
