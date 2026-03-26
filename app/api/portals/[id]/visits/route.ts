import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { serverError, tooManyRequests } from '@/lib/errors';
import { checkRateLimit, getRateLimitKey } from '@/lib/rateLimit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Rate limit: 1 visit per portal per IP per minute
  const rl = checkRateLimit(getRateLimitKey(request, `visit:${id}`), 1, 60_000);
  if (!rl.allowed) return tooManyRequests();

  const user = await getAuthUser(request);
  const sessionId = request.headers.get('x-session-id') || `anon-${Date.now()}`;

  try {
    // Record visit
    await prisma.portalVisit.create({
      data: {
        portalId: id,
        userId: user?.id || null,
        sessionId,
      },
    });

    // Increment visit count
    await prisma.portal.update({
      where: { id },
      data: { totalVisits: { increment: 1 } },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[POST /api/portals/[id]/visits] Error:', e);
    return serverError();
  }
}
