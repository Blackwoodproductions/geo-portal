import { POST as registerHandler } from '@/app/api/auth/register/route';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { buildRequest, cleanDatabase } from '../helpers';
import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';

beforeAll(async () => {
  await cleanDatabase();
  // Create a user for login rate limit tests
  const passwordHash = await hashPassword('password123');
  await prisma.user.create({
    data: { email: 'ratelimit@test.com', passwordHash, displayName: 'RL User' },
  });
});

afterAll(async () => {
  await cleanDatabase();
});

describe('Registration rate limiting', () => {
  it('should block after 5 registrations per minute', async () => {
    // Send 5 requests (all with unique emails)
    for (let i = 0; i < 5; i++) {
      const req = buildRequest('/api/auth/register', {
        method: 'POST',
        body: { email: `ratelimit-reg-${i}@test.com`, password: 'password123' },
        headers: { 'x-forwarded-for': '10.0.0.99' },
      });
      const res = await registerHandler(req);
      // These should succeed (201) or fail for other reasons, but not 429
      expect(res.status).not.toBe(429);
    }

    // 6th should be rate limited
    const req = buildRequest('/api/auth/register', {
      method: 'POST',
      body: { email: 'ratelimit-reg-blocked@test.com', password: 'password123' },
      headers: { 'x-forwarded-for': '10.0.0.99' },
    });
    const res = await registerHandler(req);
    expect(res.status).toBe(429);
  });
});

describe('Login rate limiting', () => {
  it('should block after 10 login attempts per minute', async () => {
    // Send 10 requests
    for (let i = 0; i < 10; i++) {
      const req = buildRequest('/api/auth/login', {
        method: 'POST',
        body: { email: 'ratelimit@test.com', password: 'password123' },
        headers: { 'x-forwarded-for': '10.0.0.100' },
      });
      const res = await loginHandler(req);
      expect(res.status).not.toBe(429);
    }

    // 11th should be rate limited
    const req = buildRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'ratelimit@test.com', password: 'password123' },
      headers: { 'x-forwarded-for': '10.0.0.100' },
    });
    const res = await loginHandler(req);
    expect(res.status).toBe(429);
  });
});
