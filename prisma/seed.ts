/**
 * Comprehensive seed script for Geo Portal.
 * Creates all demo data needed for a fresh VPS deployment:
 * - Users (with hashed passwords)
 * - Portals across all 7 styles, multiple categories, multiple locations
 * - Portal visits (for leaderboard data)
 * - Portal messages (chat history)
 * - Portal reactions
 *
 * Safe to re-run — uses upserts for users.
 * Run: npx prisma db seed
 */
import { PrismaClient, PortalStyle } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...\n');

  // ─── Users ───
  const passwordHash = await bcrypt.hash('password123', 12);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@geoportal.com' },
    update: {},
    create: {
      email: 'alice@geoportal.com',
      passwordHash,
      displayName: 'Alice Chen',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@geoportal.com' },
    update: {},
    create: {
      email: 'bob@geoportal.com',
      passwordHash,
      displayName: 'Bob Martinez',
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@geoportal.com' },
    update: {},
    create: {
      email: 'carol@geoportal.com',
      passwordHash,
      displayName: 'Carol Johnson',
    },
  });

  const dave = await prisma.user.upsert({
    where: { email: 'dave@geoportal.com' },
    update: {},
    create: {
      email: 'dave@geoportal.com',
      passwordHash,
      displayName: 'Dave Kim',
    },
  });

  console.log(`Created 4 users (password: password123 for all)`);

  // ─── Portals ───
  // Covers all 7 portal styles, multiple categories from each section, varied locations

  const portals = [
    // ── Bogotá ──
    {
      ownerId: alice.id,
      name: 'Plaza Bolívar Gateway',
      description: 'Portal en el corazón histórico de Bogotá. Descubre eventos culturales y tours por La Candelaria.',
      latitude: 4.5981,
      longitude: -74.0758,
      locationName: 'Plaza de Bolívar',
      neighborhood: 'La Candelaria',
      countryCode: 'CO',
      portalStyle: 'neon_ring' as PortalStyle,
      portalType: 'landmark',
      category: 'entertainment',
      contentType: 'website' as const,
      destinationType: 'link',
      totalVisits: 342,
      totalInteractions: 89,
    },
    {
      ownerId: alice.id,
      name: 'Monserrate Vortex',
      description: 'Step through the vortex at the summit and see Bogotá from above — 3,152m elevation.',
      latitude: 4.6057,
      longitude: -74.0557,
      locationName: 'Cerro de Monserrate',
      neighborhood: 'Santa Fe',
      countryCode: 'CO',
      portalStyle: 'vortex_spiral' as PortalStyle,
      portalType: 'scenic',
      category: 'art',
      contentType: 'image' as const,
      totalVisits: 189,
      totalInteractions: 45,
    },
    {
      ownerId: bob.id,
      name: 'Zona T Hologram',
      description: 'Nightlife central — bars, clubs, and live music. Check out tonight\'s events in Zona Rosa.',
      latitude: 4.6667,
      longitude: -74.0524,
      locationName: 'Zona T',
      neighborhood: 'Chapinero',
      countryCode: 'CO',
      portalStyle: 'holographic_frame' as PortalStyle,
      portalType: 'info',
      category: 'nightlife',
      contentType: 'mixed_media' as const,
      totalVisits: 512,
      totalInteractions: 134,
    },
    {
      ownerId: alice.id,
      name: 'Usaquén Tech Wormhole',
      description: 'Startup hub — coworking spaces and monthly demo days. Colombia\'s growing tech scene.',
      latitude: 4.6945,
      longitude: -74.0321,
      locationName: 'Usaquén',
      neighborhood: 'Usaquén',
      countryCode: 'CO',
      portalStyle: 'wormhole' as PortalStyle,
      portalType: 'community',
      category: 'tech',
      contentType: 'website' as const,
      totalVisits: 156,
      totalInteractions: 78,
    },
    {
      ownerId: dave.id,
      name: 'Universidad Nacional Hub',
      description: 'Campus events, free lectures, and study groups. Open to the public.',
      latitude: 4.6382,
      longitude: -74.0832,
      locationName: 'Universidad Nacional',
      neighborhood: 'Teusaquillo',
      countryCode: 'CO',
      portalStyle: 'holographic_frame' as PortalStyle,
      portalType: 'campus',
      category: 'education',
      contentType: 'website' as const,
      totalVisits: 124,
      totalInteractions: 56,
    },
    {
      ownerId: alice.id,
      name: 'La Candelaria Community Board',
      description: 'Neighborhood meetups, volunteer opportunities, and local cultural events.',
      latitude: 4.5956,
      longitude: -74.0705,
      locationName: 'Chorro de Quevedo',
      neighborhood: 'La Candelaria',
      countryCode: 'CO',
      portalStyle: 'vortex_spiral' as PortalStyle,
      portalType: 'community',
      category: 'community',
      contentType: 'mixed_media' as const,
      totalVisits: 87,
      totalInteractions: 34,
    },
    {
      ownerId: dave.id,
      name: 'Museo del Oro Space Rift',
      description: 'Dimensional tear revealing pre-Colombian gold artifacts. One of the world\'s finest collections.',
      latitude: 4.6018,
      longitude: -74.0719,
      locationName: 'Museo del Oro',
      neighborhood: 'La Candelaria',
      countryCode: 'CO',
      portalStyle: 'space_rift' as PortalStyle,
      portalType: 'gallery',
      category: 'art',
      contentType: 'image' as const,
      totalVisits: 98,
      totalInteractions: 41,
    },
    {
      ownerId: carol.id,
      name: 'Paloquemao Food Portal',
      description: 'Best arepas, empanadas, and fresh tropical fruit. Community-rated market stalls.',
      latitude: 4.6225,
      longitude: -74.0859,
      locationName: 'Plaza de Mercado Paloquemao',
      neighborhood: 'Los Mártires',
      countryCode: 'CO',
      portalStyle: 'neon_ring' as PortalStyle,
      portalType: 'guide',
      category: 'food',
      contentType: 'business_info' as const,
      totalVisits: 278,
      totalInteractions: 92,
    },

    // ── Medellín ──
    {
      ownerId: bob.id,
      name: 'Plaza Botero Portal',
      description: 'Iconic Botero sculptures in the heart of Medellín. Free outdoor gallery and city tours depart here.',
      latitude: 6.2518,
      longitude: -75.5636,
      locationName: 'Plaza Botero',
      neighborhood: 'La Candelaria',
      countryCode: 'CO',
      portalStyle: 'plasma_gate' as PortalStyle,
      portalType: 'landmark',
      category: 'art',
      contentType: 'image' as const,
      totalVisits: 287,
      totalInteractions: 76,
    },
    {
      ownerId: carol.id,
      name: 'Comuna 13 Graffiti Vortex',
      description: 'Street art capital of Colombia. Ride the outdoor escalators and explore the murals.',
      latitude: 6.2463,
      longitude: -75.5997,
      locationName: 'Comuna 13',
      neighborhood: 'San Javier',
      countryCode: 'CO',
      portalStyle: 'vortex_spiral' as PortalStyle,
      portalType: 'scenic',
      category: 'art',
      contentType: 'video' as const,
      totalVisits: 345,
      totalInteractions: 112,
    },

    // ── Cartagena ──
    {
      ownerId: carol.id,
      name: 'Ciudad Amurallada Hologram',
      description: 'Walk the colonial walled city — restaurants, history, and Caribbean vibes.',
      latitude: 10.4236,
      longitude: -75.5478,
      locationName: 'Ciudad Amurallada',
      neighborhood: 'Centro Histórico',
      countryCode: 'CO',
      portalStyle: 'holographic_frame' as PortalStyle,
      portalType: 'directory',
      category: 'shopping',
      contentType: 'business_info' as const,
      totalVisits: 267,
      totalInteractions: 89,
    },
    {
      ownerId: bob.id,
      name: 'Playa Blanca Swimming',
      description: 'Crystal clear Caribbean waters. Boat schedules and beach conditions updated daily.',
      latitude: 10.2280,
      longitude: -75.5900,
      locationName: 'Playa Blanca',
      neighborhood: 'Isla Barú',
      countryCode: 'CO',
      portalStyle: 'wormhole' as PortalStyle,
      portalType: 'beach',
      category: 'swimming',
      contentType: 'website' as const,
      totalVisits: 203,
      totalInteractions: 67,
    },

    // ── Coffee Region ──
    {
      ownerId: bob.id,
      name: 'Valle de Cocora Hiking',
      description: 'Hike among the world\'s tallest palm trees. Trail conditions and guides available.',
      latitude: 4.6383,
      longitude: -75.4875,
      locationName: 'Valle de Cocora',
      neighborhood: 'Salento',
      countryCode: 'CO',
      portalStyle: 'nebula_cloud' as PortalStyle,
      portalType: 'trailhead',
      category: 'hiking',
      contentType: 'mixed_media' as const,
      totalVisits: 134,
      totalInteractions: 67,
    },
    {
      ownerId: alice.id,
      name: 'Salento Coffee Foraging',
      description: 'Learn to pick and process coffee beans. Farm tours and tastings every morning.',
      latitude: 4.6370,
      longitude: -75.5681,
      locationName: 'Fincas Cafeteras',
      neighborhood: 'Salento',
      countryCode: 'CO',
      portalStyle: 'neon_ring' as PortalStyle,
      portalType: 'event',
      category: 'foraging',
      contentType: 'mixed_media' as const,
      totalVisits: 34,
      totalInteractions: 19,
    },

    // ── Cali ──
    {
      ownerId: bob.id,
      name: 'Río Pance Fishing Spot',
      description: 'Freshwater fishing along the Pance river. Bring your rod and share your catches.',
      latitude: 3.3363,
      longitude: -76.5811,
      locationName: 'Río Pance',
      neighborhood: 'Pance',
      countryCode: 'CO',
      portalStyle: 'nebula_cloud' as PortalStyle,
      portalType: 'activity',
      category: 'fishing',
      contentType: 'image' as const,
      totalVisits: 67,
      totalInteractions: 23,
    },

    // ── Santa Marta / Tayrona ──
    {
      ownerId: carol.id,
      name: 'Tayrona Campground',
      description: 'Camping in the jungle by the Caribbean sea. Permit info and hammock rental spots.',
      latitude: 11.2948,
      longitude: -74.0580,
      locationName: 'Parque Tayrona',
      neighborhood: 'Cabo San Juan',
      countryCode: 'CO',
      portalStyle: 'plasma_gate' as PortalStyle,
      portalType: 'campground',
      category: 'camping',
      contentType: 'image' as const,
      totalVisits: 56,
      totalInteractions: 29,
    },

    // ── Llanos / Adventure ──
    {
      ownerId: dave.id,
      name: 'Llanos ATV Trails',
      description: 'Off-road adventures across the Colombian plains. Weekend group rides and safari tours.',
      latitude: 4.1420,
      longitude: -73.6266,
      locationName: 'Llanos Orientales',
      neighborhood: 'Villavicencio',
      countryCode: 'CO',
      portalStyle: 'space_rift' as PortalStyle,
      portalType: 'activity',
      category: 'atv',
      contentType: 'video' as const,
      totalVisits: 78,
      totalInteractions: 45,
    },

    // ── For Sale / Marketplace ──
    {
      ownerId: carol.id,
      name: 'Chapinero Apartment Listings',
      description: 'Modern apartments for sale in Bogotá\'s trendiest neighborhood.',
      latitude: 4.6486,
      longitude: -74.0628,
      locationName: 'Chapinero',
      neighborhood: 'Chapinero',
      countryCode: 'CO',
      portalStyle: 'holographic_frame' as PortalStyle,
      portalType: 'listing',
      category: 'houses',
      contentType: 'business_info' as const,
      totalVisits: 156,
      totalInteractions: 12,
    },
    {
      ownerId: dave.id,
      name: 'Calle 13 Cars & Motos',
      description: 'Used cars, trucks, and motorcycles for sale across Bogotá.',
      latitude: 4.6098,
      longitude: -74.0917,
      locationName: 'Zona Industrial',
      neighborhood: 'Puente Aranda',
      countryCode: 'CO',
      portalStyle: 'plasma_gate' as PortalStyle,
      portalType: 'marketplace',
      category: 'cars',
      contentType: 'image' as const,
      totalVisits: 89,
      totalInteractions: 34,
    },
    {
      ownerId: bob.id,
      name: 'Finca Land Parcels — Eje Cafetero',
      description: 'Buildable lots and coffee fincas in the Eje Cafetero region.',
      latitude: 4.8133,
      longitude: -75.6961,
      locationName: 'Eje Cafetero',
      neighborhood: 'Pereira',
      countryCode: 'CO',
      portalStyle: 'nebula_cloud' as PortalStyle,
      portalType: 'listing',
      category: 'land',
      contentType: 'website' as const,
      totalVisits: 45,
      totalInteractions: 8,
    },
    {
      ownerId: alice.id,
      name: 'San Alejo Flea Market',
      description: 'Vintage furniture, antiques, and handmade crafts every Sunday in Usaquén.',
      latitude: 4.6958,
      longitude: -74.0309,
      locationName: 'Mercado de San Alejo',
      neighborhood: 'Usaquén',
      countryCode: 'CO',
      portalStyle: 'vortex_spiral' as PortalStyle,
      portalType: 'marketplace',
      category: 'furniture',
      contentType: 'image' as const,
      totalVisits: 67,
      totalInteractions: 28,
    },
    {
      ownerId: dave.id,
      name: 'San Andresito Electronics',
      description: 'Refurbished laptops, phones, and components at the best prices in Bogotá.',
      latitude: 4.6133,
      longitude: -74.0953,
      locationName: 'San Andresito',
      neighborhood: 'Puente Aranda',
      countryCode: 'CO',
      portalStyle: 'space_rift' as PortalStyle,
      portalType: 'marketplace',
      category: 'electronics',
      contentType: 'business_info' as const,
      totalVisits: 112,
      totalInteractions: 56,
    },

    // ── Business ──
    {
      ownerId: bob.id,
      name: 'WeWork Bogotá Coworking',
      description: 'Hot desks and private offices. Coffee included. Community of remote workers and startups.',
      latitude: 4.6673,
      longitude: -74.0554,
      locationName: 'Calle 85',
      neighborhood: 'Chapinero Alto',
      countryCode: 'CO',
      portalStyle: 'holographic_frame' as PortalStyle,
      portalType: 'business',
      category: 'business',
      contentType: 'website' as const,
      totalVisits: 98,
      totalInteractions: 45,
    },

    // ── Garage Sales ──
    {
      ownerId: carol.id,
      name: 'Usaquén Weekend Market',
      description: 'Artisan goods, street food, and weekend deals. Updated every Friday.',
      latitude: 4.6920,
      longitude: -74.0335,
      locationName: 'Parque de Usaquén',
      neighborhood: 'Usaquén',
      countryCode: 'CO',
      portalStyle: 'plasma_gate' as PortalStyle,
      portalType: 'marketplace',
      category: 'garage_sales',
      contentType: 'business_info' as const,
      totalVisits: 43,
      totalInteractions: 18,
    },

    // ── Hidden / Private portal (tests visibility) ──
    {
      ownerId: alice.id,
      name: 'Alice Private Test Portal',
      description: 'This portal is private — only visible to Alice.',
      latitude: 4.6097,
      longitude: -74.0818,
      locationName: 'Centro Internacional',
      neighborhood: 'Santa Fe',
      countryCode: 'CO',
      portalStyle: 'neon_ring' as PortalStyle,
      portalType: 'test',
      category: 'other',
      isPublic: false,
      isHidden: true,
      totalVisits: 3,
    },
  ];

  // Clear existing portals and related data (safe re-run)
  await prisma.portalReaction.deleteMany();
  await prisma.portalMessage.deleteMany();
  await prisma.portalVisit.deleteMany();
  await prisma.portal.deleteMany();

  const createdPortals = [];
  for (const portal of portals) {
    const created = await prisma.portal.create({ data: portal });
    createdPortals.push(created);
  }

  console.log(`Created ${createdPortals.length} portals across all 7 styles and multiple categories`);

  // ─── Visits (for leaderboard data) ───
  const publicPortals = createdPortals.filter((p) => p.isPublic);
  const users = [alice, bob, carol, dave];
  let visitCount = 0;

  for (const portal of publicPortals) {
    // Each public portal gets visits from random users
    const numVisits = Math.min(portal.totalVisits, 10); // Cap at 10 actual visit records
    for (let i = 0; i < numVisits; i++) {
      const visitor = users[i % users.length];
      await prisma.portalVisit.create({
        data: {
          portalId: portal.id,
          userId: visitor.id,
          sessionId: `seed-session-${portal.id}-${i}`,
        },
      });
      visitCount++;
    }
  }

  console.log(`Created ${visitCount} portal visits`);

  // ─── Chat Messages ───
  const chatPortals = publicPortals.slice(0, 5); // Add chat to first 5 portals
  let messageCount = 0;

  const sampleMessages = [
    'Just visited this portal, amazing!',
    'Anyone else nearby right now?',
    'Love the vibe here',
    'How do I get to this location?',
    'This is my favorite portal in the area',
    'Meeting here at 3pm if anyone wants to join',
    'The view from here is incredible',
    'First time here, didn\'t expect it to be so cool',
    'Been coming here every week for a month now',
    'Great spot for photos!',
  ];

  for (const portal of chatPortals) {
    const numMessages = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numMessages; i++) {
      const author = users[i % users.length];
      await prisma.portalMessage.create({
        data: {
          portalId: portal.id,
          userId: author.id,
          content: sampleMessages[i % sampleMessages.length],
        },
      });
      messageCount++;
    }
  }

  console.log(`Created ${messageCount} chat messages`);

  // ─── Reactions ───
  const reactionTypes = ['🔥', '💜', '✨', '👽', '🌀', '⚡'];
  let reactionCount = 0;

  for (const portal of publicPortals.slice(0, 10)) {
    for (const user of users) {
      // Each user reacts to portals with 1-2 random reactions
      const numReactions = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numReactions; i++) {
        const reactionType = reactionTypes[(reactionCount + i) % reactionTypes.length];
        try {
          await prisma.portalReaction.create({
            data: {
              portalId: portal.id,
              userId: user.id,
              reactionType,
            },
          });
          reactionCount++;
        } catch {
          // Unique constraint — skip duplicates
        }
      }
    }
  }

  console.log(`Created ${reactionCount} reactions`);

  // ─── Summary ───
  console.log('\n--- Seed Summary ---');
  console.log(`Users:     4 (alice, bob, carol, dave — all password: password123)`);
  console.log(`Portals:   ${createdPortals.length} (7 styles, 4 category sections, Colombia)`);
  console.log(`Visits:    ${visitCount}`);
  console.log(`Messages:  ${messageCount}`);
  console.log(`Reactions: ${reactionCount}`);
  console.log('\nSeed complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
