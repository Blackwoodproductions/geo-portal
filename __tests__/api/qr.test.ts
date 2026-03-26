import { GET as qrHandler } from '@/app/api/portals/[id]/qr/route';
import { buildRequest, createTestUser, createTestPortal, cleanDatabase } from '../helpers';

let user: Awaited<ReturnType<typeof createTestUser>>;
let portalId: string;

beforeAll(async () => {
  await cleanDatabase();
  user = await createTestUser('qr@test.com');
  const portal = await createTestPortal(user.user.id);
  portalId = portal.id;
});

afterAll(async () => {
  await cleanDatabase();
});

describe('GET /api/portals/[id]/qr', () => {
  it('should return SVG with correct content type', async () => {
    const req = buildRequest(`/api/portals/${portalId}/qr`);
    const params = Promise.resolve({ id: portalId });

    const res = await qrHandler(req, { params });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/svg+xml');

    const body = await res.text();
    expect(body).toContain('<svg');
    expect(body).toContain('GEO PORTAL');
  });

  it('should return 404 for non-existent portal', async () => {
    const req = buildRequest('/api/portals/00000000-0000-0000-0000-000000000000/qr');
    const params = Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' });

    const res = await qrHandler(req, { params });
    expect(res.status).toBe(404);
  });
});
