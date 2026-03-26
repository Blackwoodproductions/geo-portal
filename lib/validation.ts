import { z } from 'zod';

// ─── Categories ───

export const PORTAL_CATEGORIES = [
  // Portal
  { id: 'general', label: 'All', icon: '🌀', section: 'portal' },
  { id: 'business', label: 'Business', icon: '🏢', section: 'portal' },
  { id: 'food', label: 'Food & Drink', icon: '🍔', section: 'portal' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎭', section: 'portal' },
  { id: 'art', label: 'Art & Culture', icon: '🎨', section: 'portal' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', section: 'portal' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌙', section: 'portal' },
  { id: 'community', label: 'Community', icon: '🤝', section: 'portal' },
  { id: 'tech', label: 'Tech', icon: '💻', section: 'portal' },
  { id: 'education', label: 'Education', icon: '📚', section: 'portal' },
  // Outdoor
  { id: 'fishing', label: 'Fishing', icon: '🎣', section: 'outdoor' },
  { id: 'hunting', label: 'Hunting', icon: '🎯', section: 'outdoor' },
  { id: 'atv', label: 'ATV / Off-Road', icon: '🏍️', section: 'outdoor' },
  { id: 'hiking', label: 'Hiking', icon: '🥾', section: 'outdoor' },
  { id: 'camping', label: 'Camping', icon: '⛺', section: 'outdoor' },
  { id: 'foraging', label: 'Foraging', icon: '🌿', section: 'outdoor' },
  { id: 'swimming', label: 'Swimming', icon: '🏊', section: 'outdoor' },
  // For Sale
  { id: 'houses', label: 'Houses', icon: '🏠', section: 'forsale' },
  { id: 'cars', label: 'Cars & Vehicles', icon: '🚗', section: 'forsale' },
  { id: 'land', label: 'Land & Property', icon: '🏞️', section: 'forsale' },
  { id: 'garage_sales', label: 'Garage Sales', icon: '🏷️', section: 'forsale' },
  { id: 'furniture', label: 'Furniture', icon: '🪑', section: 'forsale' },
  { id: 'electronics', label: 'Electronics', icon: '📱', section: 'forsale' },
  // Other
  { id: 'other', label: 'Other', icon: '📍', section: 'other' },
] as const;

export type PortalCategory = typeof PORTAL_CATEGORIES[number]['id'];

const categoryIds = PORTAL_CATEGORIES.map((c) => c.id) as [string, ...string[]];

// ─── Portal Styles ───

export const PORTAL_STYLES = [
  { id: 'neon_ring', label: 'Neon Ring', description: 'Cyberpunk energy halo' },
  { id: 'holographic_frame', label: 'Hologram', description: 'Prismatic light matrix' },
  { id: 'vortex_spiral', label: 'Vortex', description: 'Swirling dimensional rift' },
  { id: 'plasma_gate', label: 'Plasma Gate', description: 'Ionized particle field' },
  { id: 'space_rift', label: 'Space Rift', description: 'Torn dimensional gap' },
  { id: 'wormhole', label: 'Wormhole', description: 'Spacetime tunnel' },
  { id: 'nebula_cloud', label: 'Nebula', description: 'Cosmic gas cloud' },
] as const;

export type PortalStyleId = typeof PORTAL_STYLES[number]['id'];

const portalStyleIds = PORTAL_STYLES.map((s) => s.id) as [string, ...string[]];

// ─── Zod Schemas ───

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required').max(50).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createPortalSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(1000).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationName: z.string().max(200).optional(),
  neighborhood: z.string().max(100).optional(),
  countryCode: z.string().max(5).optional(),
  portalStyle: z.enum(portalStyleIds).optional(),
  portalType: z.string().max(50).optional(),
  contentType: z.enum(['image', 'video', 'website', 'business_info', 'mixed_media']).optional(),
  destinationType: z.string().max(50).optional(),
  destinationMeta: z.record(z.unknown()).optional(),
  contentUrl: z.string().url().optional(),
  contentMetadata: z.record(z.unknown()).optional(),
  category: z.enum(categoryIds).default('general'),
  isPublic: z.boolean().default(true),
});

export const updatePortalSchema = createPortalSchema.partial();

export const spatialSearchSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius_meters: z.coerce.number().min(1).max(50000).default(2000),
  limit: z.coerce.number().min(1).max(200).default(50),
});

export const chatMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000),
});

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.enum(categoryIds).optional(),
  ownerId: z.string().optional(),
});
