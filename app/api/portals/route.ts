import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { createPortalSchema, paginationSchema } from '@/lib/validation';
import { badRequest, unauthorized, serverError } from '@/lib/errors';
import { anchorPortal } from '@/lib/h3Spatial';
import { OWNER_SELECT, emitEvent } from '@/lib/api-helpers';
import { Prisma, PortalStyle, ContentType } from '@prisma/client';

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = paginationSchema.safeParse(params);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);

  const { cursor, limit, category, ownerId } = parsed.data;

  // If ownerId=me, resolve from auth
  let resolvedOwnerId = ownerId;
  if (ownerId === 'me') {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    resolvedOwnerId = user.id;
  }

  try {
    const where: Prisma.PortalWhereInput = { isActive: true, isHidden: false };
    if (category && category !== 'general') where.category = category;
    if (resolvedOwnerId) {
      where.ownerId = resolvedOwnerId;
      delete where.isHidden; // owner can see their own hidden portals
    } else {
      where.isPublic = true;
    }
    if (cursor) where.id = { lt: cursor };

    const portals = await prisma.portal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        owner: { select: OWNER_SELECT },
      },
    });

    const nextCursor = portals.length === limit ? portals[portals.length - 1].id : null;

    return NextResponse.json({ portals, nextCursor });
  } catch (e) {
    console.error('[GET /api/portals] Error:', e);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = createPortalSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);

  const data = parsed.data;

  try {
    // Snap coordinates to H3 hex center for stable anchoring
    const anchor = anchorPortal(data.latitude, data.longitude);

    const portal = await prisma.portal.create({
      data: {
        ownerId: user.id,
        name: data.name,
        description: data.description,
        latitude: anchor.lat,
        longitude: anchor.lng,
        locationName: data.locationName,
        neighborhood: data.neighborhood,
        countryCode: data.countryCode,
        portalStyle: data.portalStyle as PortalStyle | undefined,
        portalType: data.portalType,
        contentType: data.contentType as ContentType | undefined,
        destinationType: data.destinationType,
        destinationMeta: data.destinationMeta as Prisma.InputJsonValue | undefined,
        contentUrl: data.contentUrl,
        contentMetadata: data.contentMetadata as Prisma.InputJsonValue | undefined,
        category: data.category,
        isPublic: data.isPublic,
      },
      include: {
        owner: { select: OWNER_SELECT },
      },
    });

    emitEvent('portal:created', portal);

    return NextResponse.json({ portal }, { status: 201 });
  } catch (e) {
    console.error('[POST /api/portals] Error:', e);
    return serverError();
  }
}
