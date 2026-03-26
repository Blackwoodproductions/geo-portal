'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface MapboxMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    label?: string;
    color?: string;
    onClick?: () => void;
  }>;
  onMapClick?: (lat: number, lng: number) => void;
  onMoveEnd?: (lat: number, lng: number, zoom: number) => void;
  className?: string;
}

export function MapboxMap({
  center = [-74.0721, 4.711],
  zoom = 13,
  markers = [],
  onMapClick,
  onMoveEnd,
  className = '',
}: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const onMoveEndRef = useRef(onMoveEnd);
  onMoveEndRef.current = onMoveEnd;

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-gray-400 ${className}`}>
        Mapbox token not configured
      </div>
    );
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN!;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center,
      zoom,
    });

    mapRef.current = map;

    if (onMapClick) {
      map.on('click', (e) => onMapClick(e.lngLat.lat, e.lngLat.lng));
    }

    map.on('moveend', () => {
      const c = map.getCenter();
      onMoveEndRef.current?.(c.lat, c.lng, map.getZoom());
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers
  useEffect(() => {
    mapMarkersRef.current.forEach((m) => m.remove());
    mapMarkersRef.current = [];

    markers.forEach((m) => {
      const el = document.createElement('div');
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '50%';
      el.style.background = m.color || '#d946ef';
      el.style.border = '2px solid white';
      el.style.boxShadow = `0 0 8px ${m.color || '#d946ef'}80`;
      el.style.cursor = 'pointer';

      const marker = new mapboxgl.Marker(el).setLngLat([m.lng, m.lat]);

      if (m.label) marker.setPopup(new mapboxgl.Popup().setText(m.label));
      if (m.onClick) el.addEventListener('click', m.onClick);

      if (mapRef.current) marker.addTo(mapRef.current);
      mapMarkersRef.current.push(marker);
    });
  }, [markers]);

  return <div ref={containerRef} className={`w-full h-full min-h-[300px] ${className}`} />;
}
