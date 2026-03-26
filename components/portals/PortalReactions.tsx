'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const REACTION_TYPES = ['🔥', '💜', '✨', '👽', '🌀', '⚡'];

interface PortalReactionsProps {
  portalId: string;
}

interface ReactionCount {
  reactionType: string;
  _count: number;
  userReacted: boolean;
}

export function PortalReactions({ portalId }: PortalReactionsProps) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<ReactionCount[]>(
    REACTION_TYPES.map((r) => ({ reactionType: r, _count: 0, userReacted: false }))
  );

  const toggleReaction = async (type: string) => {
    if (!user) return;
    // Optimistic update
    setReactions((prev) =>
      prev.map((r) =>
        r.reactionType === type
          ? { ...r, _count: r.userReacted ? r._count - 1 : r._count + 1, userReacted: !r.userReacted }
          : r
      )
    );
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {reactions.map((r) => (
        <button
          key={r.reactionType}
          onClick={() => toggleReaction(r.reactionType)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
            r.userReacted
              ? 'bg-purple-600/30 border border-purple-500'
              : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
          }`}
        >
          <span>{r.reactionType}</span>
          {r._count > 0 && <span className="text-xs text-gray-400">{r._count}</span>}
        </button>
      ))}
    </div>
  );
}
