-- CreateEnum
CREATE TYPE "PortalStyle" AS ENUM ('neon_ring', 'holographic_frame', 'vortex_spiral', 'plasma_gate', 'space_rift', 'wormhole', 'nebula_cloud');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('image', 'video', 'website', 'business_info', 'mixed_media');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portals" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location_name" TEXT,
    "neighborhood" TEXT,
    "country_code" TEXT,
    "portal_style" "PortalStyle" DEFAULT 'vortex_spiral',
    "portal_type" TEXT DEFAULT 'vortex',
    "content_type" "ContentType" DEFAULT 'image',
    "destination_type" TEXT DEFAULT 'vroom',
    "destination_meta" JSONB,
    "content_url" TEXT,
    "content_metadata" JSONB,
    "thumbnail_url" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "total_visits" INTEGER NOT NULL DEFAULT 0,
    "total_interactions" INTEGER NOT NULL DEFAULT 0,
    "gigi_earned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "placement_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "visit_reward" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "placed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "portals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_visits" (
    "id" TEXT NOT NULL,
    "portal_id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "visited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_messages" (
    "id" TEXT NOT NULL,
    "portal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_reactions" (
    "id" TEXT NOT NULL,
    "portal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reaction_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_portal_location" ON "portals"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "idx_portal_owner" ON "portals"("owner_id");

-- CreateIndex
CREATE INDEX "idx_portal_category" ON "portals"("category");

-- CreateIndex
CREATE INDEX "idx_portal_discovery" ON "portals"("is_active", "is_public");

-- CreateIndex
CREATE INDEX "idx_message_portal_time" ON "portal_messages"("portal_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "portal_reactions_portal_id_user_id_reaction_type_key" ON "portal_reactions"("portal_id", "user_id", "reaction_type");

-- AddForeignKey
ALTER TABLE "portals" ADD CONSTRAINT "portals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_visits" ADD CONSTRAINT "portal_visits_portal_id_fkey" FOREIGN KEY ("portal_id") REFERENCES "portals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_visits" ADD CONSTRAINT "portal_visits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_messages" ADD CONSTRAINT "portal_messages_portal_id_fkey" FOREIGN KEY ("portal_id") REFERENCES "portals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_messages" ADD CONSTRAINT "portal_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_reactions" ADD CONSTRAINT "portal_reactions_portal_id_fkey" FOREIGN KEY ("portal_id") REFERENCES "portals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_reactions" ADD CONSTRAINT "portal_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
