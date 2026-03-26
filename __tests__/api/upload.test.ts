import { POST as uploadHandler } from '@/app/api/upload/route';
import { GET as fileHandler } from '@/app/api/files/[filename]/route';
import { createTestUser, cleanDatabase } from '../helpers';
import { NextRequest } from 'next/server';
import { unlink, rm } from 'fs/promises';
import path from 'path';

let user: Awaited<ReturnType<typeof createTestUser>>;

// JPEG magic bytes (FF D8 FF)
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...Array(96).fill(0)]);
// PNG magic bytes (89 50 4E 47)
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, ...Array(96).fill(0)]);

function buildUploadRequest(cookie: string | undefined, file: File): NextRequest {
  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {};
  if (cookie) headers['cookie'] = cookie;

  return new NextRequest(new URL('/api/upload', 'http://localhost:3000'), {
    method: 'POST',
    headers,
    body: formData,
  });
}

beforeAll(async () => {
  await cleanDatabase();
  user = await createTestUser('upload@test.com');
});

afterAll(async () => {
  await cleanDatabase();
  // Clean test uploads
  try {
    await rm(path.resolve('./uploads_test'), { recursive: true, force: true });
  } catch {}
});

describe('POST /api/upload', () => {
  it('should upload a valid JPEG and return file info', async () => {
    const file = new File([JPEG_BYTES], 'photo.jpg', { type: 'image/jpeg' });
    const req = buildUploadRequest(user.cookie, file);

    const res = await uploadHandler(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.filename).toMatch(/^[0-9a-f-]+\.jpg$/);
    expect(data.url).toMatch(/^\/api\/files\//);
    expect(data.type).toBe('image/jpeg');
  });

  it('should reject unauthenticated upload', async () => {
    const file = new File([JPEG_BYTES], 'photo.jpg', { type: 'image/jpeg' });
    const req = buildUploadRequest(undefined, file);

    const res = await uploadHandler(req);
    expect(res.status).toBe(401);
  });

  it('should reject oversized file', async () => {
    // Create >10MB file
    const bigBuffer = new Uint8Array(11 * 1024 * 1024);
    bigBuffer[0] = 0xff; bigBuffer[1] = 0xd8; bigBuffer[2] = 0xff;
    const file = new File([bigBuffer], 'big.jpg', { type: 'image/jpeg' });
    const req = buildUploadRequest(user.cookie, file);

    const res = await uploadHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('too large');
  });

  it('should reject disallowed MIME type', async () => {
    const file = new File([new Uint8Array(100)], 'evil.exe', { type: 'application/x-msdownload' });
    const req = buildUploadRequest(user.cookie, file);

    const res = await uploadHandler(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('not allowed');
  });

  it('should reject mismatched magic bytes', async () => {
    // PNG bytes but claim JPEG mime type
    const file = new File([PNG_BYTES], 'fake.jpg', { type: 'image/jpeg' });
    const req = buildUploadRequest(user.cookie, file);

    const res = await uploadHandler(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('does not match');
  });
});

describe('GET /api/files/[filename]', () => {
  it('should serve an uploaded file with correct content type', async () => {
    // Upload first
    const file = new File([JPEG_BYTES], 'serve-test.jpg', { type: 'image/jpeg' });
    const uploadReq = buildUploadRequest(user.cookie, file);
    const uploadRes = await uploadHandler(uploadReq);
    const { filename } = await uploadRes.json();

    // Now fetch it
    const req = new NextRequest(new URL(`/api/files/${filename}`, 'http://localhost:3000'));
    const params = Promise.resolve({ filename });

    const res = await fileHandler(req, { params });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/jpeg');
  });
});
