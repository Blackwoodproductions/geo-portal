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
    // ── NYC Area ──
    {
      ownerId: alice.id,
      name: 'Central Park Gateway',
      description: 'A vibrant portal at the heart of Central Park. Walk through the neon ring to discover events happening today.',
      latitude: 40.7829,
      longitude: -73.9654,
      locationName: 'Central Park',
      neighborhood: 'Upper West Side',
      countryCode: 'US',
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
      name: 'Brooklyn Bridge Vortex',
      description: 'Step through the swirling vortex and see the city skyline from a whole new dimension.',
      latitude: 40.7061,
      longitude: -73.9969,
      locationName: 'Brooklyn Bridge',
      neighborhood: 'DUMBO',
      countryCode: 'US',
      portalStyle: 'vortex_spiral' as PortalStyle,
      portalType: 'scenic',
      category: 'art',
      contentType: 'image' as const,
      totalVisits: 189,
      totalInteractions: 45,
    },
    {
      ownerId: bob.id,
      name: 'Times Square Hologram',
      description: 'Neon lights everywhere — this portal fits right in. Check out tonight\'s shows and events.',
      latitude: 40.758,
      longitude: -73.9855,
      locationName: 'Times Square',
      neighborhood: 'Midtown',
      countryCode: 'US',
      portalStyle: 'holographic_frame' as PortalStyle,
      portalType: 'info',
      category: 'nightlife',
      contentType: 'mixed_media' as const,
      totalVisits: 512,
      totalInteractions: 134,
    },
    {
      ownerId: bob.id,
      name: 'Pelham Bay Fishing Spot',
      description: 'Best bass fishing in the northeast. Drop a line and share your catches here.',
      latitude: 40.8448,
      longitude: -73.8648,
      locationName: 'Pelham Bay Park',
      neighborhood: 'Bronx',
      countryCode: 'US',
      portalStyle: 'nebula_cloud' as PortalStyle,
      portalType: 'activity',
      category: 'fishing',
      contentType: 'image' as const,
      totalVisits: 67,
      totalInteractions: 23,
    },
    {
      ownerId: alice.id,
      name: 'Chelsea Tech Wormhole',
      description: 'Startup portal — check out what local founders are building. Monthly demo days every first Friday.',
      latitude: 40.7425,
      longitude: -74.0061,
      locationName: 'Chelsea Market',
      neighborhood: 'Chelsea',
      countryCode: 'US',
      portalStyle: 'wormhole' as PortalStyle,
      portalType: 'community',
      category: 'tech',
      contentType: 'website' as const,
      totalVisits: 156,
      totalInteractions: 78,
    },
    {
      ownerId: carol.id,
      name: 'Queens Village Garage Sales',
      description: 'Weekend garage sales in the area. Updated every Friday with Saturday\'s locations.',
      latitude: 40.7282,
      longitude: -73.7949,
      locationName: 'Queens Village',
      neighborhood: 'Queens',
      countryCode: 'US',
      portalStyle: 'plasma_gate' as PortalStyle,
      portalType: 'marketplace',
      category: 'garage_sales',
      contentType: 'business_info' as const,
      totalVisits: 43,
      totalInteractions: 18,
    },
    {
      ownerId: dave.id,
      name: 'SoHo Art Space Rift',
      description: 'Dimensional tear revealing the gallery scene. This week: contemporary sculpture exhibit.',
      latitude: 40.7233,
      longitude: -74.0020,
      locationName: 'SoHo',
      neighborhood: 'SoHo',
      countryCode: 'US',
      portalStyle: 'space_rift' as PortalStyle,
      portalType: 'gallery',
      category: 'art',
      contentType: 'image' as const,
      totalVisits: 98,
      totalInteractions: 41,
    },
    {
      ownerId: carol.id,
      name: 'Williamsburg Food Portal',
      description: 'The best tacos, pizza, and ramen within walking distance. Community-rated rankings.',
      latitude: 40.7081,
      longitude: -73.9571,
      locationName: 'Williamsburg',
      neighborhood: 'Williamsburg',
      countryCode: 'US',
      portalStyle: 'neon_ring' as PortalStyle,
      portalType: 'guide',
      category: 'food',
      contentType: 'business_info' as const,
      totalVisits: 278,
      totalInteractions: 92,
    },
    {
      ownerId: dave.id,
      name: 'Columbia University Hub',
      description: 'Study groups, campus events, and free lectures. Open to the public.',
      latitude: 40.8075,
      longitude: -73.9626,
      locationName: 'Columbia University',
      neighborhood: 'Morningside Heights',
      countryCode: 'US',
      portalStyle: 'holographic_frame' as PortalStyle,
      portalType: 'campus',
      category: 'education',
      contentType: 'website' as const,
      totalVisits: 124,
      totalInteractions: 56,
    },
    {
      ownerId: alice.id,
      name: 'East Village Community Board',
      description: 'Neighborhood meetups, volunteer opportunities, and local government updates.',
      latitude: 40.7265,
      longitude: -73.9815,
      locationName: 'Tompkins Square Park',
      neighborhood: 'East Village',
      countryCode: 'US',
      portalStyle: 'vortex_spiral' as PortalStyle,
      portalType: 'community',
      category: 'community',
      contentType: 'mixed_media' as const,
      totalVisits: 87,
      totalInteractions: 34,
    },

    // ── Outdoor & Recreation ──
    {
      ownerId: bob.id,
      name: 'Harriman State Park Trail Head',
      description: 'Hiking trails rated by difficulty. Real-time trail conditions from fellow hikers.',
      latitude: 41.2537,
      longitude: -74.0846,
      locationName: 'Harriman State Park',
      neighborhood: 'Bear Mountain',
      countryCode: 'US',
      portalStyle: 'nebula_cloud' as PortalStyle,
      portalType: 'trailhead',
      category: 'hiking',
      contentType: 'mixed_media' as const,
      totalVisits: 134,
      totalInteractions: 67,
    },
    {
      ownerId: carol.id,
      name: 'Pine Barrens Campground',
      description: 'Best camping spots in the NJ Pine Barrens. Fire permits and weather updates.',
      latitude: 39.8685,
      longitude: -74.5752,
      locationName: 'Wharton State Forest',
      neighborhood: 'Pine Barrens',
      countryCode: 'US',
      portalStyle: 'plasma_gate' as PortalStyle,
      portalType: 'campground',
      category: 'camping',
      contentType: 'image' as const,
      totalVisits: 56,
      totalInteractions: 29,
    },
    {
      ownerId: dave.id,
      name: 'Catskills ATV Trails',
      description: 'Off-road trails and meetup schedule. Weekend group rides every Saturday 8am.',
      latitude: 42.0987,
      longitude: -74.2640,
      locationName: 'Catskill Mountains',
      neighborhood: 'Catskills',
      countryCode: 'US',
      portalStyle: 'space_rift' as PortalStyle,
      portalType: 'activity',
      category: 'atv',
      contentType: 'video' as const,
      totalVisits: 78,
      totalInteractions: 45,
    },
    {
      ownerId: bob.id,
      name: 'Jones Beach Swimming',
      description: 'Water temps, lifeguard schedules, and parking updates for Jones Beach.',
      latitude: 40.5901,
      longitude: -73.5081,
      locationName: 'Jones Beach',
      neighborhood: 'Long Island',
      countryCode: 'US',
      portalStyle: 'wormhole' as PortalStyle,
      portalType: 'beach',
      category: 'swimming',
      contentType: 'website' as const,
      totalVisits: 203,
      totalInteractions: 67,
    },
    {
      ownerId: alice.id,
      name: 'Central Park Foraging Walk',
      description: 'Guided foraging walks identifying edible plants. Next walk this Saturday at 10am.',
      latitude: 40.7732,
      longitude: -73.9712,
      locationName: 'North Woods, Central Park',
      neighborhood: 'Upper West Side',
      countryCode: 'US',
      portalStyle: 'neon_ring' as PortalStyle,
      portalType: 'event',
      category: 'foraging',
      contentType: 'mixed_media' as const,
      totalVisits: 34,
      totalInteractions: 19,
    },

    // ── For Sale / Marketplace ──
    {
      ownerId: carol.id,
      name: 'Brooklyn Brownstone Listing',
      description: '3BR/2BA brownstone in Park Slope. Open house this weekend.',
      latitude: 40.6710,
      longitude: -73.9777,
      locationName: 'Park Slope',
      neighborhood: 'Park Slope',
      countryCode: 'US',
      portalStyle: 'holographic_frame' as PortalStyle,
      portalType: 'listing',
      category: 'houses',
      contentType: 'business_info' as const,
      totalVisits: 156,
      totalInteractions: 12,
    },
    {
      ownerId: dave.id,
      name: 'Jersey City Cars & Vehicles',
      description: 'Used cars, trucks, and motorcycles for sale in the JC area.',
      latitude: 40.7178,
      longitude: -74.0431,
      locationName: 'Jersey City',
      neighborhood: 'Jersey City',
      countryCode: 'US',
      portalStyle: 'plasma_gate' as PortalStyle,
      portalType: 'marketplace',
      category: 'cars',
      contentType: 'image' as const,
      totalVisits: 89,
      totalInteractions: 34,
    },
    {
      ownerId: bob.id,
      name: 'Hudson Valley Land Parcels',
      description: 'Buildable lots and farmland available in the Hudson Valley region.',
      latitude: 41.4341,
      longitude: -74.0860,
      locationName: 'Hudson Valley',
      neighborhood: 'Newburgh',
      countryCode: 'US',
      portalStyle: 'nebula_cloud' as PortalStyle,
      portalType: 'listing',
      category: 'land',
      contentType: 'website' as const,
      totalVisits: 45,
      totalInteractions: 8,
    },
    {
      ownerId: alice.id,
      name: 'LES Furniture Exchange',
      description: 'Mid-century modern, vintage, and upcycled furniture from Lower East Side makers.',
      latitude: 40.7150,
      longitude: -73.9843,
      locationName: 'Lower East Side',
      neighborhood: 'LES',
      countryCode: 'US',
      portalStyle: 'vortex_spiral' as PortalStyle,
      portalType: 'marketplace',
      category: 'furniture',
      contentType: 'image' as const,
      totalVisits: 67,
      totalInteractions: 28,
    },
    {
      ownerId: dave.id,
      name: 'Flushing Electronics Market',
      description: 'Refurbished laptops, phones, and components. Best deals in Queens.',
      latitude: 40.7580,
      longitude: -73.8330,
      locationName: 'Flushing',
      neighborhood: 'Flushing',
      countryCode: 'US',
      portalStyle: 'space_rift' as PortalStyle,
      portalType: 'marketplace',
      category: 'electronics',
      contentType: 'business_info' as const,
      totalVisits: 112,
      totalInteractions: 56,
    },

    // ── Shopping & Business ──
    {
      ownerId: carol.id,
      name: 'Fifth Avenue Shopping District',
      description: 'Today\'s deals and new arrivals from stores along 5th Ave.',
      latitude: 40.7631,
      longitude: -73.9712,
      locationName: 'Fifth Avenue',
      neighborhood: 'Midtown',
      countryCode: 'US',
      portalStyle: 'wormhole' as PortalStyle,
      portalType: 'directory',
      category: 'shopping',
      contentType: 'business_info' as const,
      totalVisits: 267,
      totalInteractions: 89,
    },
    {
      ownerId: bob.id,
      name: 'Flatiron Coworking Space',
      description: 'Hot desks available daily. Coffee included. Community of 200+ remote workers.',
      latitude: 40.7411,
      longitude: -73.9897,
      locationName: 'Flatiron Building',
      neighborhood: 'Flatiron',
      countryCode: 'US',
      portalStyle: 'holographic_frame' as PortalStyle,
      portalType: 'business',
      category: 'business',
      contentType: 'website' as const,
      totalVisits: 98,
      totalInteractions: 45,
    },

    // ── Hidden / Private portal (tests visibility) ──
    {
      ownerId: alice.id,
      name: 'Alice Private Test Portal',
      description: 'This portal is private — only visible to Alice.',
      latitude: 40.7128,
      longitude: -74.006,
      locationName: 'City Hall',
      neighborhood: 'Financial District',
      countryCode: 'US',
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
  console.log(`Portals:   ${createdPortals.length} (7 styles, 4 category sections, NYC area)`);
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
