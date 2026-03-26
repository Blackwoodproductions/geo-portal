import { POST as registerHandler } from '@/app/api/auth/register/route';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { GET as meHandler } from '@/app/api/auth/me/route';
import { POST as logoutHandler } from '@/app/api/auth/logout/route';
import { buildRequest, cleanDatabase } from '../helpers';

beforeAll(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
});

describe('POST /api/auth/register', () => {
  it('should register a new user and set cookie', async () => {
    const req = buildRequest('/api/auth/register', {
      method: 'POST',
      body: { email: 'newuser@test.com', password: 'password123', displayName: 'New User' },
    });
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('newuser@test.com');
    expect(data.user.displayName).toBe('New User');

    // Check cookie is set
    const cookie = res.headers.getSetCookie?.()?.find((c: string) => c.startsWith('geo_portal_token='));
    expect(cookie).toBeDefined();
    expect(cookie).toContain('HttpOnly');
    expect(cookie?.toLowerCase()).toContain('samesite=strict');
  });

  it('should reject duplicate email', async () => {
    const req = buildRequest('/api/auth/register', {
      method: 'POST',
      body: { email: 'newuser@test.com', password: 'password123' },
    });
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('EMAIL_EXISTS');
  });

  it('should reject invalid email', async () => {
    const req = buildRequest('/api/auth/register', {
      method: 'POST',
      body: { email: 'not-an-email', password: 'password123' },
    });
    const res = await registerHandler(req);

    expect(res.status).toBe(400);
  });

  it('should reject password shorter than 8 chars', async () => {
    const req = buildRequest('/api/auth/register', {
      method: 'POST',
      body: { email: 'short@test.com', password: 'short' },
    });
    const res = await registerHandler(req);

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('should login with valid credentials and set cookie', async () => {
    const req = buildRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'newuser@test.com', password: 'password123' },
    });
    const res = await loginHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.email).toBe('newuser@test.com');

    const cookie = res.headers.getSetCookie?.()?.find((c: string) => c.startsWith('geo_portal_token='));
    expect(cookie).toBeDefined();
  });

  it('should reject wrong password', async () => {
    const req = buildRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'newuser@test.com', password: 'wrongpassword' },
    });
    const res = await loginHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('INVALID_CREDENTIALS');
  });

  it('should reject non-existent email', async () => {
    const req = buildRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'nobody@test.com', password: 'password123' },
    });
    const res = await loginHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('GET /api/auth/me', () => {
  it('should return user when authenticated', async () => {
    // Login first to get cookie
    const loginReq = buildRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'newuser@test.com', password: 'password123' },
    });
    const loginRes = await loginHandler(loginReq);
    const rawCookie = loginRes.headers.getSetCookie?.()?.find((c: string) => c.startsWith('geo_portal_token='));
    const cookieValue = rawCookie?.split(';')[0] || '';

    const meReq = buildRequest('/api/auth/me', { cookie: cookieValue });
    const meRes = await meHandler(meReq);
    const data = await meRes.json();

    expect(meRes.status).toBe(200);
    expect(data.user.email).toBe('newuser@test.com');
  });

  it('should return 401 without cookie', async () => {
    const req = buildRequest('/api/auth/me');
    const res = await meHandler(req);

    expect(res.status).toBe(401);
  });
});
