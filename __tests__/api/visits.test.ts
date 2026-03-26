import { POST as visitHandler } from '@/app/api/portals/[id]/visits/route';
import { buildRequest, createTestUser, createTestPortal, cleanDatabase } from '../helpers';
import { prisma } from '@/lib/db';

let user: Awaited<ReturnType<typeof createTestUser>>;
let portalId: string;

beforeAll(async () => {
  await cleanDatabase();
  user = await createTestUser('visits@test.com');
  const portal = await createTestPortal(user.user.id, { totalVisits: 0 });
  portalId = portal.id;
});

afterAll(async () => {
  await cleanDatabase();
});

describe('POST /api/portals/[id]/visits', () => {
  it('should log a visit and increment totalVisits', async () => {
    const req = buildRequest(`/api/portals/${portalId}/visits`, {
      method: 'POST',
      cookie: user.cookie,
    });
    const params = Promise.resolve({ id: portalId });

    const res = await visitHandler(req, { params });
    expect(res.status).toBe(200);

    const portal = await prisma.portal.findUnique({ where: { id: portalId } });
    expect(portal!.totalVisits).toBe(1);
  });

  it('should rate limit repeat visits to same portal', async () => {
    // 1st visit already used above, 2nd should be blocked (1 per minute per IP per portal)
    const req = buildRequest(`/api/portals/${portalId}/visits`, {
      method: 'POST',
    });
    const params = Promise.resolve({ id: portalId });

    const res = await visitHandler(req, { params });
    expect(res.status).toBe(429);
  });

  it('should record anonymous visits with session ID', async () => {
    // Create a different portal so we're not rate-limited
    const otherPortal = await createTestPortal(user.user.id, { totalVisits: 0 });
    const req = buildRequest(`/api/portals/${otherPortal.id}/visits`, {
      method: 'POST',
      headers: { 'x-session-id': 'anon-session-123' },
    });
    const params = Promise.resolve({ id: otherPortal.id });

    const res = await visitHandler(req, { params });
    expect(res.status).toBe(200);

    const visit = await prisma.portalVisit.findFirst({
      where: { portalId: otherPortal.id },
    });
    expect(visit!.userId).toBeNull();
    expect(visit!.sessionId).toBe('anon-session-123');
  });
});
