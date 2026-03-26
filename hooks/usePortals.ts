'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { PORTAL_CATEGORIES } from '@/lib/validation';

export { PORTAL_CATEGORIES };

export interface Portal {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  locationName: string | null;
  neighborhood: string | null;
  countryCode: string | null;
  portalStyle: string | null;
  portalType: string | null;
  contentType: string | null;
  destinationType: string | null;
  destinationMeta: Record<string, unknown> | null;
  contentUrl: string | null;
  thumbnailUrl: string | null;
  category: string;
  isActive: boolean;
  isPublic: boolean;
  isHidden: boolean;
  totalVisits: number;
  totalInteractions: number;
  placedAt: string;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; displayName: string | null; avatarUrl: string | null };
}

export const PORTAL_KEYS = {
  all: ['portals'] as const,
  list: (filters?: Record<string, unknown>) => [...PORTAL_KEYS.all, 'list', filters] as const,
  detail: (id: string) => [...PORTAL_KEYS.all, 'detail', id] as const,
  nearby: (lat: number, lng: number, radius: number) =>
    [...PORTAL_KEYS.all, 'nearby', { lat, lng, radius }] as const,
  mine: () => [...PORTAL_KEYS.all, 'mine'] as const,
};

async function fetchPortals(params?: Record<string, string>): Promise<{ portals: Portal[]; nextCursor: string | null }> {
  const query = new URLSearchParams(params || {});
  const res = await fetch(`/api/portals?${query}`);
  if (!res.ok) throw new Error('Failed to fetch portals');
  return res.json();
}

export function usePortals(category?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PORTAL_KEYS.list({ category }),
    queryFn: () => fetchPortals(category && category !== 'general' ? { category } : undefined),
  });

  // Listen for realtime portal events
  useEffect(() => {
    const socket = getSocket();
    const handleInvalidate = () => queryClient.invalidateQueries({ queryKey: PORTAL_KEYS.all });

    socket.on('portal:created', handleInvalidate);
    socket.on('portal:updated', handleInvalidate);
    socket.on('portal:deleted', handleInvalidate);

    return () => {
      socket.off('portal:created', handleInvalidate);
      socket.off('portal:updated', handleInvalidate);
      socket.off('portal:deleted', handleInvalidate);
    };
  }, [queryClient]);

  return {
    portals: query.data?.portals ?? [],
    nextCursor: query.data?.nextCursor ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export function useMyPortals() {
  const query = useQuery({
    queryKey: PORTAL_KEYS.mine(),
    queryFn: () => fetchPortals({ ownerId: 'me' }),
  });

  return {
    portals: query.data?.portals ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export function usePortalDetail(id: string) {
  return useQuery({
    queryKey: PORTAL_KEYS.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/portals/${id}`);
      if (!res.ok) throw new Error('Portal not found');
      const data = await res.json();
      return data.portal as Portal & { _count: { visits: number; messages: number; reactions: number } };
    },
    enabled: !!id,
  });
}

export function useCreatePortal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/portals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create portal');
      }
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PORTAL_KEYS.all });
    },
  });
}

export function useDeletePortal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (portalId: string) => {
      const res = await fetch(`/api/portals/${portalId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete portal');
      }
    },
    onMutate: async (portalId: string) => {
      await queryClient.cancelQueries({ queryKey: PORTAL_KEYS.all });
      const previous = queryClient.getQueryData(PORTAL_KEYS.list());
      queryClient.setQueryData<any>(PORTAL_KEYS.list(), (old: any) => ({
        ...old,
        portals: (old?.portals ?? []).filter((p: Portal) => p.id !== portalId),
      }));
      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(PORTAL_KEYS.list(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PORTAL_KEYS.all });
    },
  });
}

export function useLogVisit() {
  return useMutation({
    mutationFn: async (portalId: string) => {
      await fetch(`/api/portals/${portalId}/visits`, { method: 'POST' });
    },
  });
}
