import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { notFound, serverError } from '@/lib/errors';
import { generateQRSvg } from '@/lib/qr';

const PORTAL_BASE_URL = process.env.PORTAL_BASE_URL || 'http://localhost:3000';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const portal = await prisma.portal.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!portal) return notFound('Portal not found');

    const portalUrl = `${PORTAL_BASE_URL}/portals/${id}`;
    const svg = generateQRSvg(portalUrl, 512);

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (e) {
    console.error('[GET /api/portals/[id]/qr] Error:', e);
    return serverError();
  }
}
