import { GET as listHandler, POST as createHandler } from '@/app/api/portals/route';
import { GET as detailHandler, PUT as updateHandler, DELETE as deleteHandler } from '@/app/api/portals/[id]/route';
import { buildRequest, createTestUser, createTestPortal, cleanDatabase } from '../helpers';
import { prisma } from '@/lib/db';

let alice: Awaited<ReturnType<typeof createTestUser>>;
let bob: Awaited<ReturnType<typeof createTestUser>>;

beforeAll(async () => {
  await cleanDatabase();
  alice = await createTestUser('alice-crud@test.com');
  bob = await createTestUser('bob-crud@test.com');
});

afterAll(async () => {
  await cleanDatabase();
});

describe('POST /api/portals', () => {
  it('should create a portal when authenticated', async () => {
    const req = buildRequest('/api/portals', {
      method: 'POST',
      cookie: alice.cookie,
      body: {
        name: 'Test Portal',
        description: 'A test',
        latitude: 40.7128,
        longitude: -74.006,
        category: 'tech',
        portalStyle: 'vortex_spiral',
      },
    });
    const res = await createHandler(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.portal.name).toBe('Test Portal');
    expect(data.portal.ownerId).toBe(alice.user.id);
    expect(data.portal.category).toBe('tech');
    // H3 anchor snaps coordinates slightly
    expect(data.portal.latitude).toBeCloseTo(40.7128, 3);
    expect(data.portal.longitude).toBeCloseTo(-74.006, 3);
  });

  it('should reject unauthenticated request', async () => {
    const req = buildRequest('/api/portals', {
      method: 'POST',
      body: { name: 'Fail', latitude: 40, longitude: -74 },
    });
    const res = await createHandler(req);
    expect(res.status).toBe(401);
  });

  it('should reject missing name', async () => {
    const req = buildRequest('/api/portals', {
      method: 'POST',
      cookie: alice.cookie,
      body: { latitude: 40, longitude: -74 },
    });
    const res = await createHandler(req);
    expect(res.status).toBe(400);
  });

  it('should reject out-of-range latitude', async () => {
    const req = buildRequest('/api/portals', {
      method: 'POST',
      cookie: alice.cookie,
      body: { name: 'Bad Lat', latitude: 91, longitude: 0 },
    });
    const res = await createHandler(req);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/portals', () => {
  it('should return paginated public portals', async () => {
    const req = buildRequest('/api/portals');
    const res = await listHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.portals)).toBe(true);
    expect(data.portals.length).toBeGreaterThan(0);
    // All should be public
    data.portals.forEach((p: any) => expect(p.isPublic).toBe(true));
  });

  it('should filter by category', async () => {
    const req = buildRequest('/api/portals?category=tech');
    const res = await listHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    data.portals.forEach((p: any) => expect(p.category).toBe('tech'));
  });

  it('should return only my portals with ownerId=me', async () => {
    const req = buildRequest('/api/portals?ownerId=me', { cookie: alice.cookie });
    const res = await listHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    data.portals.forEach((p: any) => expect(p.ownerId).toBe(alice.user.id));
  });
});

describe('GET /api/portals/[id]', () => {
  it('should return portal detail with counts', async () => {
    const portal = await createTestPortal(alice.user.id);
    const req = buildRequest(`/api/portals/${portal.id}`);
    const params = Promise.resolve({ id: portal.id });

    const res = await detailHandler(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.portal.id).toBe(portal.id);
    expect(data.portal._count).toBeDefined();
  });

  it('should return 404 for non-existent portal', async () => {
    const req = buildRequest('/api/portals/00000000-0000-0000-0000-000000000000');
    const params = Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' });

    const res = await detailHandler(req, { params });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/portals/[id]', () => {
  it('should update portal as owner', async () => {
    const portal = await createTestPortal(alice.user.id);
    const req = buildRequest(`/api/portals/${portal.id}`, {
      method: 'PUT',
      cookie: alice.cookie,
      body: { name: 'Updated Name' },
    });
    const params = Promise.resolve({ id: portal.id });

    const res = await updateHandler(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.portal.name).toBe('Updated Name');
  });

  it('should return 403 for non-owner', async () => {
    const portal = await createTestPortal(alice.user.id);
    const req = buildRequest(`/api/portals/${portal.id}`, {
      method: 'PUT',
      cookie: bob.cookie,
      body: { name: 'Hijacked' },
    });
    const params = Promise.resolve({ id: portal.id });

    const res = await updateHandler(req, { params });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/portals/[id]', () => {
  it('should delete portal and cascade related records', async () => {
    const portal = await createTestPortal(alice.user.id);

    // Add related records
    await prisma.portalVisit.create({ data: { portalId: portal.id, sessionId: 'test' } });
    await prisma.portalMessage.create({ data: { portalId: portal.id, userId: alice.user.id, content: 'hello' } });
    await prisma.portalReaction.create({ data: { portalId: portal.id, userId: alice.user.id, reactionType: '🔥' } });

    const req = buildRequest(`/api/portals/${portal.id}`, {
      method: 'DELETE',
      cookie: alice.cookie,
    });
    const params = Promise.resolve({ id: portal.id });

    const res = await deleteHandler(req, { params });
    expect(res.status).toBe(200);

    // Verify cascade
    const visits = await prisma.portalVisit.count({ where: { portalId: portal.id } });
    const messages = await prisma.portalMessage.count({ where: { portalId: portal.id } });
    const reactions = await prisma.portalReaction.count({ where: { portalId: portal.id } });
    expect(visits).toBe(0);
    expect(messages).toBe(0);
    expect(reactions).toBe(0);
  });
});
