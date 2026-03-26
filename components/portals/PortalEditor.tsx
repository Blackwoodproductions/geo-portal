'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreatePortal } from '@/hooks/usePortals';
import { PORTAL_STYLES, PORTAL_CATEGORIES } from '@/lib/validation';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import dynamic from 'next/dynamic';

const PortalLocationPicker = dynamic(
  () => import('./PortalLocationPicker').then((m) => m.PortalLocationPicker),
  { ssr: false, loading: () => <div className="h-64 bg-gray-800 rounded-lg animate-pulse" /> }
);
import { Loader2 } from 'lucide-react';

export function PortalEditor() {
  const router = useRouter();
  const createPortal = useCreatePortal();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState('');
  const [portalStyle, setPortalStyle] = useState('vortex_spiral');
  const [category, setCategory] = useState('general');
  const [contentType, setContentType] = useState('image');
  const [contentUrl, setContentUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!latitude || !longitude) {
      setError('Please select a location on the map');
      return;
    }
    setError('');

    try {
      await createPortal.mutateAsync({
        name,
        description: description || undefined,
        latitude,
        longitude,
        locationName: locationName || undefined,
        portalStyle,
        category,
        contentType,
        contentUrl: contentUrl || undefined,
        isPublic,
      });
      router.push('/my-portals');
    } catch (e: any) {
      setError(e.message || 'Failed to create portal');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      {error && <ErrorAlert message={error} />}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Portal Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
          placeholder="Give your portal a name"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 resize-none"
          placeholder="What is this portal about?"
        />
      </div>

      {/* Portal Style */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Portal Style</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PORTAL_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setPortalStyle(s.id)}
              className={`p-3 rounded-lg text-left transition-all ${
                portalStyle === s.id
                  ? 'bg-purple-600/30 border border-purple-500'
                  : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
              }`}
            >
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-xs text-gray-500">{s.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
        >
          {PORTAL_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.label} ({c.section})
            </option>
          ))}
        </select>
      </div>

      {/* Content URL */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Content URL (optional)</label>
        <input
          value={contentUrl}
          onChange={(e) => setContentUrl(e.target.value)}
          type="url"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
          placeholder="https://..."
        />
      </div>

      {/* Visibility */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="isPublic" className="text-sm text-gray-300">
          Public portal (visible to everyone)
        </label>
      </div>

      {/* Location Picker */}
      <PortalLocationPicker
        onLocationSelect={(lat, lng, name) => {
          setLatitude(lat);
          setLongitude(lng);
          if (name) setLocationName(name);
        }}
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={createPortal.isPending}
        className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        {createPortal.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {createPortal.isPending ? 'Creating...' : 'Create Portal'}
      </button>
    </form>
  );
}
