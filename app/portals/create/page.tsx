'use client';

import { AuthGuard } from '@/components/layout/AuthGuard';
import { PortalEditor } from '@/components/portals/PortalEditor';

export default function CreatePortalPage() {
  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Create Portal</h1>
        <PortalEditor />
      </div>
    </AuthGuard>
  );
}
