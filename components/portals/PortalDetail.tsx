'use client';

import { usePortalDetail, useLogVisit } from '@/hooks/usePortals';
import { useEffect } from 'react';
import { Eye, MapPin, Clock, User } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { PortalChat } from './PortalChat';
import { PortalReactions } from './PortalReactions';

interface PortalDetailProps {
  portalId: string;
}

export function PortalDetail({ portalId }: PortalDetailProps) {
  const { data: portal, isLoading, error } = usePortalDetail(portalId);
  const logVisit = useLogVisit();

  useEffect(() => {
    if (portalId) logVisit.mutate(portalId);
  }, [portalId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error || !portal) {
    return <p className="text-center text-red-400 py-12">Portal not found</p>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{portal.name}</h1>
            {portal.portalStyle && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-300 mt-1 inline-block">
                {portal.portalStyle.replace('_', ' ')}
              </span>
            )}
          </div>
          {/* QR code link */}
          <a
            href={`/api/portals/${portalId}/qr`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            View QR
          </a>
        </div>

        {portal.description && <p className="text-gray-400 mb-4">{portal.description}</p>}

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>{portal.totalVisits} visits</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{portal.locationName || `${portal.latitude.toFixed(4)}, ${portal.longitude.toFixed(4)}`}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{new Date(portal.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{portal.owner?.displayName || 'Anonymous'}</span>
          </div>
        </div>
      </div>

      {/* Reactions */}
      <PortalReactions portalId={portalId} />

      {/* Chat */}
      <PortalChat portalId={portalId} />
    </div>
  );
}
