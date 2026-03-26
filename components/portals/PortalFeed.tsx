'use client';

import { useState } from 'react';
import { usePortals, PORTAL_CATEGORIES, Portal } from '@/hooks/usePortals';
import { PortalCard } from './PortalCard';
import { Spinner } from '@/components/ui/Spinner';

interface PortalFeedProps {
  onPortalClick?: (portal: Portal) => void;
}

export function PortalFeed({ onPortalClick }: PortalFeedProps) {
  const [activeSection, setActiveSection] = useState<string>('portal');
  const [activeCategory, setActiveCategory] = useState<string>('general');
  const { portals, loading, error } = usePortals(activeCategory !== 'general' ? activeCategory : undefined);

  const sections = [...new Set(PORTAL_CATEGORIES.map((c) => c.section))];
  const sectionCategories = PORTAL_CATEGORIES.filter((c) => c.section === activeSection);

  return (
    <div className="space-y-4">
      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => { setActiveSection(s); setActiveCategory('general'); }}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
              activeSection === s ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sectionCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
              activeCategory === c.id ? 'bg-purple-600/30 text-purple-300 border border-purple-500' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}
      {error && <p className="text-center text-red-400 py-4">{error}</p>}

      {/* Portal grid */}
      {!loading && portals.length === 0 && (
        <p className="text-center text-gray-500 py-12">No portals found in this category</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {portals.map((portal) => (
          <PortalCard key={portal.id} portal={portal} onClick={() => onPortalClick?.(portal)} />
        ))}
      </div>
    </div>
  );
}

