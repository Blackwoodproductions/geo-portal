import { GET as nearbyHandler } from '@/app/api/portals/nearby/route';
import { buildRequest, createTestUser, createTestPortal, cleanDatabase } from '../helpers';

let user: Awaited<ReturnType<typeof createTestUser>>;

beforeAll(async () => {
  await cleanDatabase();
  user = await createTestUser('spatial@test.com');

  // Create portals at known locations around NYC
  await createTestPortal(user.user.id, {
    name: 'Central Park',
    latitude: 40.7829,
    longitude: -73.9654,
    category: 'entertainment',
  });
  await createTestPortal(user.user.id, {
    name: 'Brooklyn Bridge',
    latitude: 40.7061,
    longitude: -73.9969,
    category: 'art',
  });
  await createTestPortal(user.user.id, {
    name: 'Far Away LA',
    latitude: 34.0522,
    longitude: -118.2437,
    category: 'tech',
  });
});

afterAll(async () => {
  await cleanDatabase();
});

describe('GET /api/portals/nearby', () => {
  it('should return portals sorted by distance with distanceMeters', async () => {
    // Search from Times Square
    const req = buildRequest('/api/portals/nearby?latitude=40.758&longitude=-73.9855&radius_meters=10000');
    const res = await nearbyHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.portals.length).toBeGreaterThanOrEqual(2);

    // All results should have distanceMeters
    data.portals.forEach((p: any) => {
      expect(typeof p.distanceMeters).toBe('number');
      expect(p.distanceMeters).toBeGreaterThanOrEqual(0);
    });

    // Should be sorted by distance ascending
    for (let i = 1; i < data.portals.length; i++) {
      expect(data.portals[i].distanceMeters).toBeGreaterThanOrEqual(data.portals[i - 1].distanceMeters);
    }
  });

  it('should exclude portals outside radius', async () => {
    // Search NYC with 10km radius — LA portal should be excluded
    const req = buildRequest('/api/portals/nearby?latitude=40.758&longitude=-73.9855&radius_meters=10000');
    const res = await nearbyHandler(req);
    const data = await res.json();

    const names = data.portals.map((p: any) => p.name);
    expect(names).not.toContain('Far Away LA');
  });

  it('should coerce string query params', async () => {
    const req = buildRequest('/api/portals/nearby?latitude=40.758&longitude=-73.9855&radius_meters=5000&limit=10');
    const res = await nearbyHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.meta.radius_meters).toBe(5000);
  });

  it('should reject missing coordinates', async () => {
    const req = buildRequest('/api/portals/nearby?radius_meters=5000');
    const res = await nearbyHandler(req);

    expect(res.status).toBe(400);
  });
});
