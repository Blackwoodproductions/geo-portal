import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, signToken, setAuthCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { badRequest, serverError, tooManyRequests } from '@/lib/errors';
import { checkRateLimit, getRateLimitKey } from '@/lib/rateLimit';
import { toUserResponse } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(getRateLimitKey(request, 'login'), 10, 60_000);
  if (!rl.allowed) return tooManyRequests();

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors[0].message);
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return badRequest('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return badRequest('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const token = signToken(user.id, user.tokenVersion);
    const response = NextResponse.json({ user: toUserResponse(user) });

    setAuthCookie(response, token);
    return response;
  } catch (e) {
    console.error('[login] Error:', e);
    return serverError();
  }
}
