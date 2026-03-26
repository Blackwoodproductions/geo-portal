import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { chatMessageSchema } from '@/lib/validation';
import { badRequest, unauthorized, serverError, tooManyRequests } from '@/lib/errors';
import { checkRateLimit, getUserRateLimitKey } from '@/lib/rateLimit';
import { OWNER_SELECT, emitToRoom } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cursor = request.nextUrl.searchParams.get('cursor');
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 50, 100);

  try {
    const where: Prisma.PortalMessageWhereInput = { portalId: id };
    if (cursor) where.id = { lt: cursor };

    const messages = await prisma.portalMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: OWNER_SELECT },
      },
    });

    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

    return NextResponse.json({ messages: messages.reverse(), nextCursor });
  } catch (e) {
    console.error('[GET /api/portals/[id]/chat] Error:', e);
    return serverError();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  // Rate limit: 10 messages/minute
  const rl = checkRateLimit(getUserRateLimitKey(user.id, 'chat'), 10, 60_000);
  if (!rl.allowed) return tooManyRequests();

  const body = await request.json().catch(() => null);
  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);

  try {
    const message = await prisma.portalMessage.create({
      data: {
        portalId: id,
        userId: user.id,
        content: parsed.data.content,
      },
      include: {
        user: { select: OWNER_SELECT },
      },
    });

    emitToRoom(`portal:${id}`, 'chat:message', message);

    return NextResponse.json({ message }, { status: 201 });
  } catch (e) {
    console.error('[POST /api/portals/[id]/chat] Error:', e);
    return serverError();
  }
}
