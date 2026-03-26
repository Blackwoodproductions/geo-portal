'use client';

import { useRouter } from 'next/navigation';
import { usePortals } from '@/hooks/usePortals';
import { Eye, MapPin } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

export function PortalLeaderboard() {
  const router = useRouter();
  const { portals, loading } = usePortals();

  // Sort by total visits descending
  const ranked = [...portals]
    .sort((a, b) => b.totalVisits - a.totalVisits)
    .slice(0, 50);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ranked.map((portal, i) => {
        const rank = i + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

        return (
          <button
            key={portal.id}
            onClick={() => router.push(`/portals/map?portal=${portal.id}`)}
            className={`w-full flex items-center gap-4 bg-gray-900 border rounded-xl p-4 text-left cursor-pointer hover:bg-gray-800/50 transition-colors ${
              rank <= 3 ? 'border-purple-500/30' : 'border-gray-800'
            }`}
          >
            <div className="w-8 text-center">
              {medal ? (
                <span className="text-xl">{medal}</span>
              ) : (
                <span className="text-sm text-gray-500">#{rank}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{portal.name}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                {portal.owner?.displayName && <span>by {portal.owner.displayName}</span>}
                {portal.locationName && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {portal.locationName}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 text-sm">
              <Eye className="w-4 h-4 text-purple-400" />
              <span className="font-medium text-purple-300">{portal.totalVisits}</span>
            </div>
          </button>
        );
      })}

      {ranked.length === 0 && (
        <p className="text-center text-gray-500 py-12">No portals yet</p>
      )}
    </div>
  );
}
