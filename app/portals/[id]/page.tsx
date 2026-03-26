'use client';

import { use } from 'react';
import { PortalDetail } from '@/components/portals/PortalDetail';

export default function PortalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PortalDetail portalId={id} />
    </div>
  );
}
