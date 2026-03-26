'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafletMapProps {
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
  className?: string;
  style?: React.CSSProperties;
}

export function LeafletMap({
  center = [40.7128, -74.006],
  zoom = 13,
  markers = [],
  onMapClick,
  className = '',
  style,
}: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(center, zoom);
    mapRef.current = map;

    // Dark CartoDB tiles (free, no API key)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    if (onMapClick) {
      map.on('click', (e) => onMapClick(e.latlng.lat, e.latlng.lng));
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    markers.forEach((m) => {
      const icon = L.divIcon({
        className: 'portal-marker',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${m.color || '#d946ef'};border:2px solid white;box-shadow:0 0 8px ${m.color || '#d946ef'}80;"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
      if (m.label) marker.bindPopup(m.label);
      if (m.onClick) marker.on('click', m.onClick);
      markersRef.current.push(marker);
    });
  }, [markers]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[300px] ${className}`}
      style={style}
    />
  );
}
