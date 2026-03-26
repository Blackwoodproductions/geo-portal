/**
 * Spatial query utilities — encapsulates raw SQL for spatial search.
 * Ported from webstackceo/supabase/functions/spatial-search/index.ts
 */
import { prisma } from './db';

export interface NearbyPortalResult {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  portalStyle: string | null;
  portalType: string | null;
  category: string;
  contentType: string | null;
  thumbnailUrl: string | null;
  totalVisits: number;
  isPublic: boolean;
  ownerId: string;
  distanceMeters: number;
}

/**
 * Haversine-based spatial search using bounding-box pre-filter + exact distance.
 * Uses a raw SQL query with the compound (latitude, longitude) index.
 */
export async function findNearbyPortals(
  lat: number,
  lng: number,
  radiusMeters: number = 2000,
  limit: number = 50
): Promise<NearbyPortalResult[]> {
  const radiusKm = radiusMeters / 1000;
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));

  const results = await prisma.$queryRaw<NearbyPortalResult[]>`
    SELECT * FROM (
      SELECT
        id,
        name,
        description,
        latitude,
        longitude,
        portal_style AS "portalStyle",
        portal_type AS "portalType",
        category,
        content_type AS "contentType",
        thumbnail_url AS "thumbnailUrl",
        total_visits AS "totalVisits",
        is_public AS "isPublic",
        owner_id AS "ownerId",
        ROUND(
          6371000 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(latitude - ${lat}) / 2), 2) +
            COS(RADIANS(${lat})) * COS(RADIANS(latitude)) *
            POWER(SIN(RADIANS(longitude - ${lng}) / 2), 2)
          ))
        )::int AS "distanceMeters"
      FROM portals
      WHERE is_active = true
        AND is_hidden = false
        AND latitude BETWEEN ${lat - latDelta} AND ${lat + latDelta}
        AND longitude BETWEEN ${lng - lngDelta} AND ${lng + lngDelta}
    ) AS nearby
    WHERE "distanceMeters" <= ${radiusMeters}
    ORDER BY "distanceMeters" ASC
    LIMIT ${limit}
  `;

  return results;
}

/** Haversine distance in meters between two coordinates (JS implementation for non-DB use) */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
