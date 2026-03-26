import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getAuthUser } from '@/lib/auth';
import { unauthorized, badRequest, serverError, tooManyRequests } from '@/lib/errors';
import { checkRateLimit, getUserRateLimitKey } from '@/lib/rateLimit';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
};

// Magic bytes for MIME type validation
const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
  'video/mp4': [], // ftyp box check done separately
};

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  // Rate limit: 10 uploads/minute
  const rl = checkRateLimit(getUserRateLimitKey(user.id, 'upload'), 10, 60_000);
  if (!rl.allowed) return tooManyRequests();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return badRequest('No file provided');

    // Check size
    if (file.size > MAX_FILE_SIZE) {
      return badRequest(`File too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check MIME type
    const ext = ALLOWED_MIME_TYPES[file.type];
    if (!ext) {
      return badRequest(`File type not allowed. Allowed: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}`);
    }

    // Read bytes for magic byte check
    const bytes = new Uint8Array(await file.arrayBuffer());
    const magic = MAGIC_BYTES[file.type];
    if (magic && magic.length > 0) {
      const matches = magic.every((byte, i) => bytes[i] === byte);
      if (!matches) {
        return badRequest('File content does not match declared type');
      }
    }

    // Generate UUID filename (prevents path traversal)
    const filename = `${randomUUID()}${ext}`;
    const uploadDir = join(process.cwd(), UPLOAD_DIR);
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), bytes);

    return NextResponse.json({
      filename,
      url: `/api/files/${filename}`,
      size: file.size,
      type: file.type,
    }, { status: 201 });
  } catch (e) {
    console.error('[POST /api/upload] Error:', e);
    return serverError();
  }
}
