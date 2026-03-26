'use client';

import { PortalLeaderboard } from '@/components/portals/PortalLeaderboard';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-8 h-8 text-purple-400" />
        <h1 className="text-3xl font-bold">Leaderboard</h1>
      </div>
      <PortalLeaderboard />
    </div>
  );
}
