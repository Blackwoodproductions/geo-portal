import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { updatePortalSchema } from '@/lib/validation';
import { badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/errors';
import { OWNER_SELECT, emitEvent } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const portal = await prisma.portal.findUnique({
      where: { id },
      include: {
        owner: { select: OWNER_SELECT },
        _count: { select: { visits: true, messages: true, reactions: true } },
      },
    });

    if (!portal) return notFound('Portal not found');

    // Non-public portals only visible to owner
    if (!portal.isPublic) {
      const user = await getAuthUser(request);
      if (!user || user.id !== portal.ownerId) return notFound('Portal not found');
    }

    return NextResponse.json({ portal });
  } catch (e) {
    console.error('[GET /api/portals/[id]] Error:', e);
    return serverError();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = updatePortalSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);

  try {
    const portal = await prisma.portal.findUnique({ where: { id } });
    if (!portal) return notFound('Portal not found');
    if (portal.ownerId !== user.id) return forbidden('You can only edit your own portals');

    const updated = await prisma.portal.update({
      where: { id },
      data: parsed.data as Prisma.PortalUpdateInput,
      include: {
        owner: { select: OWNER_SELECT },
      },
    });

    emitEvent('portal:updated', updated);

    return NextResponse.json({ portal: updated });
  } catch (e) {
    console.error('[PUT /api/portals/[id]] Error:', e);
    return serverError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const portal = await prisma.portal.findUnique({ where: { id } });
    if (!portal) return notFound('Portal not found');
    if (portal.ownerId !== user.id) return forbidden('You can only delete your own portals');

    // Cascade deletes visits, messages, reactions
    await prisma.portal.delete({ where: { id } });

    emitEvent('portal:deleted', { id });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[DELETE /api/portals/[id]] Error:', e);
    return serverError();
  }
}
