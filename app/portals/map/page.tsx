'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { MapProviderSelector, MapProvider } from '@/components/map/MapProviderSelector';
import { useSpatialSearch } from '@/hooks/useSpatialSearch';
import { PORTAL_KEYS, type Portal } from '@/hooks/usePortals';
import { Spinner } from '@/components/ui/Spinner';

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap').then((m) => m.LeafletMap), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-900 animate-pulse" />,
});

const MapboxMap = dynamic(() => import('@/components/map/MapboxMap').then((m) => m.MapboxMap), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-900 animate-pulse" />,
});

const BOGOTA = { lat: 4.711, lng: -74.0721 };

type MapScope = 'local' | 'all';

export default function MapPage() {
  const router = useRouter();
  const [provider, setProvider] = useState<MapProvider>('openstreetmap');
  const [scope, setScope] = useState<MapScope>('local');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState(BOGOTA);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setMapCenter(loc);
        },
        () => setUserLocation(BOGOTA),
        { enableHighAccuracy: true }
      );
    } else {
      setUserLocation(BOGOTA);
    }
  }, []);

  // Spatial search — pass 0,0 when scope is 'all' to hit the existing short-circuit
  const { results } = useSpatialSearch(
    scope === 'local' ? mapCenter.lat : 0,
    scope === 'local' ? mapCenter.lng : 0,
    5000
  );

  // All portals — only fetched in 'all' mode
  // TODO: cursor-based fetching for true "all" support (currently capped at 100)
  const allPortalsQuery = useQuery({
    queryKey: PORTAL_KEYS.list({ limit: 100 }),
    queryFn: async () => {
      const res = await fetch('/api/portals?limit=100');
      if (!res.ok) throw new Error('Failed to fetch portals');
      return res.json() as Promise<{ portals: Portal[]; nextCursor: string | null }>;
    },
    enabled: scope === 'all',
  });

  // Debounced moveend — tracks position in both modes, avoids API flood in local mode
  const handleMoveEnd = useCallback((lat: number, lng: number) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setMapCenter({ lat, lng }), 400);
  }, []);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // Build markers based on scope
  const markers = scope === 'local'
    ? (results?.portals || []).map((p) => ({
        id: p.id,
        lat: p.latitude,
        lng: p.longitude,
        label: `${p.name} (${p.distanceMeters}m)`,
        color: '#d946ef',
        onClick: () => router.push(`/portals/${p.id}`),
      }))
    : (allPortalsQuery.data?.portals || []).map((p) => ({
        id: p.id,
        lat: p.latitude,
        lng: p.longitude,
        label: p.name,
        color: '#d946ef',
        onClick: () => router.push(`/portals/${p.id}`),
      }));

  // Compute center/zoom for "All" mode from bounding box
  const allCenter = (() => {
    if (scope !== 'all' || !allPortalsQuery.data?.portals?.length) return null;
    const portals = allPortalsQuery.data.portals;
    const lats = portals.map((p) => p.latitude);
    const lngs = portals.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const spread = Math.max(maxLat - minLat, maxLng - minLng, 0.001);
    return {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2,
      zoom: Math.max(2, Math.min(14, Math.floor(14 - Math.log2(spread * 111)))),
    };
  })();

  const displayCenter = scope === 'all' && allCenter
    ? { lat: allCenter.lat, lng: allCenter.lng }
    : mapCenter;
  const displayZoom = scope === 'all' && allCenter ? allCenter.zoom : 14;

  if (!userLocation) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] relative">
      {/* Map provider selector */}
      <div className="absolute top-4 right-4 z-10">
        <MapProviderSelector selected={provider} onChange={setProvider} />
      </div>

      {/* Scope toggle */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(['local', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                scope === s
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {s === 'local' ? 'Local' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Map — key on scope to remount with correct center/zoom on toggle */}
      {provider === 'openstreetmap' ? (
        <LeafletMap
          key={scope}
          center={[displayCenter.lat, displayCenter.lng]}
          zoom={displayZoom}
          markers={markers}
          onMoveEnd={handleMoveEnd}
        />
      ) : (
        <MapboxMap
          key={scope}
          center={[displayCenter.lng, displayCenter.lat]}
          zoom={displayZoom}
          markers={markers}
          onMoveEnd={handleMoveEnd}
        />
      )}

      {/* Portal count / empty state overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm">
        {scope === 'local' ? (
          results
            ? results.meta.total_results > 0
              ? `${results.meta.total_results} portals nearby`
              : 'No portals in this area'
            : 'Searching...'
        ) : (
          allPortalsQuery.data
            ? `${allPortalsQuery.data.portals.length} portals total`
            : 'Loading...'
        )}
      </div>
    </div>
  );
}
