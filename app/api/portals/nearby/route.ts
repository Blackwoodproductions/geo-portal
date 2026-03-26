import { NextRequest, NextResponse } from 'next/server';
import { spatialSearchSchema } from '@/lib/validation';
import { findNearbyPortals } from '@/lib/spatial';
import { badRequest, serverError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = spatialSearchSchema.safeParse(params);
  if (!parsed.success) return badRequest(parsed.error.errors[0].message);

  const { latitude, longitude, radius_meters, limit } = parsed.data;

  try {
    const portals = await findNearbyPortals(latitude, longitude, radius_meters, limit);

    return NextResponse.json({
      portals,
      meta: {
        center: { latitude, longitude },
        radius_meters,
        total_results: portals.length,
        queried_at: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error('[GET /api/portals/nearby] Error:', e);
    return serverError();
  }
}
