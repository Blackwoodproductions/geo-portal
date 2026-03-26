'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TILE_STYLES = [
  { id: 'dark_all', label: 'Dark' },
  { id: 'dark_nolabels', label: 'Dark (no labels)' },
  { id: 'voyager', label: 'Voyager' },
  { id: 'voyager_nolabels', label: 'Voyager (no labels)' },
  { id: 'rastertiles/voyager', label: 'Voyager Raster' },
  { id: 'light_all', label: 'Light' },
] as const;

type TileStyleId = typeof TILE_STYLES[number]['id'];

function tileUrl(styleId: TileStyleId) {
  return `https://{s}.basemaps.cartocdn.com/${styleId}/{z}/{x}/{y}{r}.png`;
}

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
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [tileStyle, setTileStyle] = useState<TileStyleId>('dark_all');
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(center, zoom);
    mapRef.current = map;

    const tile = L.tileLayer(tileUrl('dark_all'), {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = tile;

    if (onMapClick) {
      map.on('click', (e) => onMapClick(e.latlng.lat, e.latlng.lng));
    }

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Swap tile layer when style changes
  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(tileUrl(tileStyle));
    }
  }, [tileStyle]);

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
    <div className={`w-full h-full min-h-[300px] relative ${className}`} style={style}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Tile style picker — below zoom controls on the left */}
      <div className="absolute left-2.5 z-[1000]" style={{ top: 80 }}>
        <button
          onClick={() => setPickerOpen((o) => !o)}
          className="w-[34px] h-[34px] bg-white rounded shadow-md flex items-center justify-center hover:bg-gray-100 border border-gray-300"
          title="Map style"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
        </button>

        {pickerOpen && (
          <div className="mt-1 bg-white rounded shadow-lg border border-gray-200 py-1 min-w-[160px]">
            {TILE_STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => { setTileStyle(s.id); setPickerOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 ${
                  tileStyle === s.id ? 'font-semibold text-purple-600 bg-purple-50' : 'text-gray-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
