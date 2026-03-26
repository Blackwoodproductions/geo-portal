'use client';

import { useMyPortals, useDeletePortal, Portal } from '@/hooks/usePortals';
import { Trash2, Edit3, Eye, EyeOff, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';

export function MyPortals() {
  const { portals, loading, error, refetch } = useMyPortals();
  const deletePortal = useDeletePortal();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this portal? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deletePortal.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleVisibility = async (portal: Portal) => {
    await fetch(`/api/portals/${portal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: !portal.isPublic }),
    });
    refetch();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error) return <p className="text-center text-red-400 py-4">{error}</p>;

  if (portals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">You haven&apos;t placed any portals yet.</p>
        <Link
          href="/portals/create"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          Create Your First Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {portals.map((portal) => (
        <div
          key={portal.id}
          className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4"
        >
          <div className="flex-1 min-w-0">
            <Link href={`/portals/${portal.id}`} className="font-medium hover:text-purple-300 transition-colors">
              {portal.name}
            </Link>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> {portal.totalVisits}
              </span>
              {portal.locationName && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3" /> {portal.locationName}
                </span>
              )}
              <span>{portal.isPublic ? 'Public' : 'Private'}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleVisibility(portal)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              title={portal.isPublic ? 'Make private' : 'Make public'}
            >
              {portal.isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <Link
              href={`/portals/create?edit=${portal.id}`}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </Link>
            <button
              onClick={() => handleDelete(portal.id)}
              disabled={deletingId === portal.id}
              className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
