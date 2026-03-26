'use client';

import { AuthGuard } from '@/components/layout/AuthGuard';
import { MyPortals } from '@/components/portals/MyPortals';

export default function MyPortalsPage() {
  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Portals</h1>
        <MyPortals />
      </div>
    </AuthGuard>
  );
}
