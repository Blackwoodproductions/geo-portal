'use client';

import { Eye, MapPin } from 'lucide-react';
import type { Portal } from '@/hooks/usePortals';

interface PortalCardProps {
  portal: Portal;
  onClick?: () => void;
}

export function PortalCard({ portal, onClick }: PortalCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-purple-500/50 transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
          {portal.name}
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-300">
          {portal.portalStyle?.replace('_', ' ') || 'portal'}
        </span>
      </div>
      {portal.description && (
        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{portal.description}</p>
      )}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" /> {portal.totalVisits}
        </span>
        {portal.locationName && (
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3" /> {portal.locationName}
          </span>
        )}
        {portal.owner?.displayName && (
          <span className="ml-auto text-gray-600">by {portal.owner.displayName}</span>
        )}
      </div>
    </button>
  );
}
