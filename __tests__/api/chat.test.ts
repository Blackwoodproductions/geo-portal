import { GET as getChatHandler, POST as postChatHandler } from '@/app/api/portals/[id]/chat/route';
import { buildRequest, createTestUser, createTestPortal, cleanDatabase } from '../helpers';

let user: Awaited<ReturnType<typeof createTestUser>>;
let portalId: string;

beforeAll(async () => {
  await cleanDatabase();
  user = await createTestUser('chat@test.com');
  const portal = await createTestPortal(user.user.id);
  portalId = portal.id;
});

afterAll(async () => {
  await cleanDatabase();
});

describe('POST /api/portals/[id]/chat', () => {
  it('should create a message when authenticated', async () => {
    const req = buildRequest(`/api/portals/${portalId}/chat`, {
      method: 'POST',
      cookie: user.cookie,
      body: { content: 'Hello portal!' },
    });
    const params = Promise.resolve({ id: portalId });

    const res = await postChatHandler(req, { params });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.message.content).toBe('Hello portal!');
    expect(data.message.user.id).toBe(user.user.id);
    expect(data.message.user.displayName).toBeDefined();
  });

  it('should reject unauthenticated message', async () => {
    const req = buildRequest(`/api/portals/${portalId}/chat`, {
      method: 'POST',
      body: { content: 'Anon msg' },
    });
    const params = Promise.resolve({ id: portalId });

    const res = await postChatHandler(req, { params });
    expect(res.status).toBe(401);
  });

  it('should reject empty message', async () => {
    const req = buildRequest(`/api/portals/${portalId}/chat`, {
      method: 'POST',
      cookie: user.cookie,
      body: { content: '' },
    });
    const params = Promise.resolve({ id: portalId });

    const res = await postChatHandler(req, { params });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/portals/[id]/chat', () => {
  it('should return messages in chronological order', async () => {
    // Post a few more messages
    for (const msg of ['msg1', 'msg2', 'msg3']) {
      const req = buildRequest(`/api/portals/${portalId}/chat`, {
        method: 'POST',
        cookie: user.cookie,
        body: { content: msg },
      });
      await postChatHandler(req, { params: Promise.resolve({ id: portalId }) });
    }

    const req = buildRequest(`/api/portals/${portalId}/chat?limit=50`);
    const params = Promise.resolve({ id: portalId });

    const res = await getChatHandler(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.messages)).toBe(true);
    expect(data.messages.length).toBeGreaterThanOrEqual(3);

    // Check chronological order (earliest first after reverse)
    for (let i = 1; i < data.messages.length; i++) {
      expect(new Date(data.messages[i].createdAt).getTime())
        .toBeGreaterThanOrEqual(new Date(data.messages[i - 1].createdAt).getTime());
    }
  });
});

describe('Chat rate limiting', () => {
  it('should block after 10 messages per minute', async () => {
    // Send 10 messages (we may have already sent some, but rate limit resets between tests via afterEach)
    for (let i = 0; i < 10; i++) {
      const req = buildRequest(`/api/portals/${portalId}/chat`, {
        method: 'POST',
        cookie: user.cookie,
        body: { content: `rate limit test ${i}` },
      });
      await postChatHandler(req, { params: Promise.resolve({ id: portalId }) });
    }

    // 11th should be blocked
    const req = buildRequest(`/api/portals/${portalId}/chat`, {
      method: 'POST',
      cookie: user.cookie,
      body: { content: 'should fail' },
    });
    const res = await postChatHandler(req, { params: Promise.resolve({ id: portalId }) });
    expect(res.status).toBe(429);
  });
});
