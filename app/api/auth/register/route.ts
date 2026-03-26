import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';
import { badRequest, serverError, tooManyRequests } from '@/lib/errors';
import { checkRateLimit, getRateLimitKey } from '@/lib/rateLimit';
import { toUserResponse } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(getRateLimitKey(request, 'register'), 5, 60_000);
  if (!rl.allowed) return tooManyRequests();

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors[0].message);
  }

  const { email, password, displayName } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return badRequest('Email already registered', 'EMAIL_EXISTS');
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName },
    });

    const token = signToken(user.id, user.tokenVersion);
    const response = NextResponse.json({ user: toUserResponse(user) }, { status: 201 });

    setAuthCookie(response, token);
    return response;
  } catch (e) {
    console.error('[register] Error:', e);
    return serverError();
  }
}
