'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

interface PortalLocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number, locationName?: string) => void;
}

export function PortalLocationPicker({
  initialLat,
  initialLng,
  onLocationSelect,
}: PortalLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [locationName, setLocationName] = useState<string>('');
  const [gettingLocation, setGettingLocation] = useState(false);

  // Reverse geocode using Nominatim (free)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`
      );
      const data = await res.json();
      const name = data.display_name?.split(',').slice(0, 3).join(', ') || '';
      setLocationName(name);
      return name;
    } catch {
      return '';
    }
  };

  const updateMarker = async (lat: number, lng: number) => {
    setLocation({ lat, lng });
    const name = await reverseGeocode(lat, lng);
    onLocationSelect(lat, lng, name);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else if (mapRef.current) {
      const icon = L.divIcon({
        className: 'location-picker-marker',
        html: '<div style="width:20px;height:20px;border-radius:50%;background:#d946ef;border:3px solid white;box-shadow:0 0 12px #d946ef80;"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(mapRef.current);
      markerRef.current.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        updateMarker(pos.lat, pos.lng);
      });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        updateMarker(latitude, longitude);
        mapRef.current?.setView([latitude, longitude], 16);
        setGettingLocation(false);
      },
      () => setGettingLocation(false),
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] = location
      ? [location.lat, location.lng]
      : [40.7128, -74.006];

    const map = L.map(containerRef.current).setView(center, 15);
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (e) => updateMarker(e.latlng.lat, e.latlng.lng));

    if (location) {
      updateMarker(location.lat, location.lng);
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">Portal Location</label>
        <button
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
        >
          <MapPin className="w-3 h-3" />
          {gettingLocation ? 'Getting location...' : 'Use my location'}
        </button>
      </div>
      <div ref={containerRef} className="w-full h-64 rounded-lg overflow-hidden border border-gray-700" />
      {locationName && (
        <p className="text-xs text-gray-400 truncate">{locationName}</p>
      )}
    </div>
  );
}
