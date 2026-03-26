'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface SpatialPortal {
  id: string;
  name: string;
  portalStyle: string | null;
  category: string;
  contentType: string | null;
  latitude: number;
  longitude: number;
  totalVisits: number;
  isPublic: boolean;
  ownerId: string;
  distanceMeters: number;
}

export interface SpatialSearchResults {
  portals: SpatialPortal[];
  meta: {
    center: { latitude: number; longitude: number };
    radius_meters: number;
    total_results: number;
    queried_at: string;
  };
}

const CACHE_TTL = 30_000; // 30s

export function useSpatialSearch(lat: number, lng: number, radiusMeters = 2000) {
  const [results, setResults] = useState<SpatialSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<{ lat: number; lng: number; ts: number } | null>(null);

  const fetchNearby = useCallback(async (forceLat?: number, forceLng?: number) => {
    const qLat = forceLat ?? lat;
    const qLng = forceLng ?? lng;
    if (!qLat || !qLng) return;

    // Skip if cache is fresh and position hasn't moved much (<~100m)
    const last = lastFetchRef.current;
    if (last && Date.now() - last.ts < CACHE_TTL) {
      const dLat = Math.abs(qLat - last.lat);
      const dLng = Math.abs(qLng - last.lng);
      if (dLat < 0.001 && dLng < 0.001) return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        latitude: String(qLat),
        longitude: String(qLng),
        radius_meters: String(radiusMeters),
        limit: '50',
      });
      const res = await fetch(`/api/portals/nearby?${params}`);
      if (!res.ok) throw new Error('Spatial search failed');
      const data = await res.json();
      setResults(data as SpatialSearchResults);
      lastFetchRef.current = { lat: qLat, lng: qLng, ts: Date.now() };
    } catch (e: any) {
      console.warn('[useSpatialSearch] Error:', e);
      setError(e.message || 'Spatial search failed');
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radiusMeters]);

  // Auto-fetch when position changes
  useEffect(() => {
    if (lat && lng) fetchNearby();
  }, [lat, lng, fetchNearby]);

  return { results, loading, error, refetch: fetchNearby };
}
