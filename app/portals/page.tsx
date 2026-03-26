'use client';

import { useRouter } from 'next/navigation';
import { PortalFeed } from '@/components/portals/PortalFeed';

export default function PortalsPage() {
  const router = useRouter();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Explore Portals</h1>
      <PortalFeed onPortalClick={(p) => router.push(`/portals/map?portal=${p.id}`)} />
    </div>
  );
}
