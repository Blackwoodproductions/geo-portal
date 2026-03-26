// Test spatial utilities (haversine, bounding box)
jest.mock('@/lib/db', () => ({ prisma: {} }));

import { haversineDistance } from '@/lib/spatial';

describe('Spatial utilities', () => {
  describe('haversineDistance', () => {
    it('should return 0 for same point', () => {
      expect(haversineDistance(40.7128, -74.006, 40.7128, -74.006)).toBeCloseTo(0, 0);
    });

    it('should calculate distance between NYC and Brooklyn Bridge', () => {
      // City Hall to Brooklyn Bridge: roughly 800m
      const d = haversineDistance(40.7128, -74.006, 40.7061, -73.9969);
      expect(d).toBeGreaterThan(500);
      expect(d).toBeLessThan(1500);
    });

    it('should calculate distance between NYC and LA (cross-country)', () => {
      const d = haversineDistance(40.7128, -74.006, 34.0522, -118.2437);
      // ~3,945 km
      expect(d).toBeGreaterThan(3_900_000);
      expect(d).toBeLessThan(4_000_000);
    });

    it('should handle equator crossing', () => {
      const d = haversineDistance(1, 0, -1, 0);
      // ~222 km
      expect(d).toBeGreaterThan(220_000);
      expect(d).toBeLessThan(225_000);
    });
  });

  describe('bounding box', () => {
    it('should compute correct lat/lng deltas for a given radius', () => {
      const radiusKm = 2; // 2km
      const lat = 40.7128;
      const latDelta = radiusKm / 111.32;
      const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));

      // At 40.7N, latDelta should be ~0.018 degrees
      expect(latDelta).toBeCloseTo(0.01797, 3);
      // lngDelta should be slightly larger since longitude converges at poles
      expect(lngDelta).toBeGreaterThan(latDelta);
      expect(lngDelta).toBeCloseTo(0.0237, 2);
    });
  });
});
