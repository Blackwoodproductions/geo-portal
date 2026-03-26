'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MapProviderSelector, MapProvider } from '@/components/map/MapProviderSelector';
import { useSpatialSearch } from '@/hooks/useSpatialSearch';
import { Spinner } from '@/components/ui/Spinner';

// Leaflet must be loaded client-side only (no SSR)
const LeafletMap = dynamic(() => import('@/components/map/LeafletMap').then((m) => m.LeafletMap), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-900 animate-pulse" />,
});

const MapboxMap = dynamic(() => import('@/components/map/MapboxMap').then((m) => m.MapboxMap), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-900 animate-pulse" />,
});

export default function MapPage() {
  const router = useRouter();
  const [provider, setProvider] = useState<MapProvider>('openstreetmap');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 40.7128, lng: -74.006 }) // Default NYC
      );
    } else {
      setUserLocation({ lat: 40.7128, lng: -74.006 });
    }
  }, []);

  const { results } = useSpatialSearch(
    userLocation?.lat || 0,
    userLocation?.lng || 0,
    5000
  );

  const markers = (results?.portals || []).map((p) => ({
    id: p.id,
    lat: p.latitude,
    lng: p.longitude,
    label: `${p.name} (${p.distanceMeters}m)`,
    color: '#d946ef',
    onClick: () => router.push(`/portals/${p.id}`),
  }));

  if (!userLocation) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] relative">
      {/* Map controls */}
      <div className="absolute top-4 right-4 z-10">
        <MapProviderSelector selected={provider} onChange={setProvider} />
      </div>

      {/* Map */}
      {provider === 'openstreetmap' ? (
        <LeafletMap
          center={[userLocation.lat, userLocation.lng]}
          zoom={14}
          markers={markers}
        />
      ) : (
        <MapboxMap
          center={[userLocation.lng, userLocation.lat]}
          zoom={14}
          markers={markers}
        />
      )}

      {/* Portal count overlay */}
      {results && (
        <div className="absolute bottom-4 left-4 z-10 bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm">
          {results.meta.total_results} portals nearby
        </div>
      )}
    </div>
  );
}
