'use client';

export type MapProvider = 'openstreetmap' | 'mapbox';

interface MapProviderSelectorProps {
  selected: MapProvider;
  onChange: (provider: MapProvider) => void;
}

export function MapProviderSelector({ selected, onChange }: MapProviderSelectorProps) {
  const providers: { id: MapProvider; label: string }[] = [
    { id: 'openstreetmap', label: 'OpenStreetMap' },
    { id: 'mapbox', label: 'Mapbox' },
  ];

  return (
    <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
      {providers.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
            selected === p.id
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
