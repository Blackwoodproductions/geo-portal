/**
 * H3 Spatial Indexing Utility — ported from webstackceo/src/utils/h3Spatial.ts
 * Uses Uber's H3 hexagonal grid for stable portal anchoring and proximity checks.
 */
import {
  latLngToCell,
  cellToLatLng,
  gridDisk,
  greatCircleDistance,
  cellToParent,
  UNITS,
} from 'h3-js';

/** Resolution for portal anchoring (~0.9 m^2 per cell) */
export const PORTAL_ANCHOR_RES = 15;

/** Resolution for proximity / collision checks (~6 m^2 per cell) */
export const PROXIMITY_RES = 14;

/** Resolution for neighborhood discovery (~300 m^2 per cell) */
export const DISCOVERY_RES = 12;

/** Minimum distance in meters between portals */
export const MIN_PORTAL_DISTANCE_M = 5;

/** Snap a lat/lng to the center of its H3 hex cell at the given resolution. */
export function snapToHexCenter(
  lat: number,
  lng: number,
  resolution = PORTAL_ANCHOR_RES
): { lat: number; lng: number; h3Index: string } {
  const h3Index = latLngToCell(lat, lng, resolution);
  const [clat, clng] = cellToLatLng(h3Index);
  return { lat: clat, lng: clng, h3Index };
}

/** Get the H3 cell index for a coordinate at the given resolution. */
export function getH3Index(lat: number, lng: number, resolution = PORTAL_ANCHOR_RES): string {
  return latLngToCell(lat, lng, resolution);
}

/** Get the center lat/lng of an H3 cell. */
export function getH3Center(h3Index: string): { lat: number; lng: number } {
  const [lat, lng] = cellToLatLng(h3Index);
  return { lat, lng };
}

/** Get all H3 cells within `ringSize` hops of a point. */
export function getNearbyCells(
  lat: number,
  lng: number,
  ringSize: number,
  resolution = PROXIMITY_RES
): string[] {
  const center = latLngToCell(lat, lng, resolution);
  return gridDisk(center, ringSize);
}

/** Check if two coordinates share the same hex cell. */
export function isSameCell(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  resolution = PROXIMITY_RES
): boolean {
  return latLngToCell(lat1, lng1, resolution) === latLngToCell(lat2, lng2, resolution);
}

/** Precise great-circle distance between two points in meters. */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return greatCircleDistance([lat1, lng1], [lat2, lng2], UNITS.m);
}

/** Get the parent cell at a coarser resolution. */
export function getParentCell(h3Index: string, parentResolution = DISCOVERY_RES): string {
  return cellToParent(h3Index, parentResolution);
}

/** Snap a portal's coordinates to its H3 anchor point. */
export function anchorPortal(lat: number, lng: number) {
  return snapToHexCenter(lat, lng, PORTAL_ANCHOR_RES);
}

/** Check if a location is too close to any existing portal. */
export function findConflict(
  lat: number,
  lng: number,
  existingPortals: Array<{ name: string; latitude: number; longitude: number }>
): { tooClose: boolean; nearestName?: string; distance?: number } {
  let closest: { name: string; dist: number } | null = null;

  const candidateCell = latLngToCell(lat, lng, PROXIMITY_RES);
  const nearbyHexes = new Set(gridDisk(candidateCell, 2));

  for (const portal of existingPortals) {
    if (portal.latitude == null || portal.longitude == null) continue;

    const portalCell = latLngToCell(portal.latitude, portal.longitude, PROXIMITY_RES);
    if (!nearbyHexes.has(portalCell)) continue;

    const d = greatCircleDistance([lat, lng], [portal.latitude, portal.longitude], UNITS.m);
    if (d < MIN_PORTAL_DISTANCE_M && (!closest || d < closest.dist)) {
      closest = { name: portal.name, dist: d };
    }
  }

  if (closest) {
    return { tooClose: true, nearestName: closest.name, distance: Math.round(closest.dist) };
  }
  return { tooClose: false };
}
