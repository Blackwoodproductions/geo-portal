import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 px-4">
      <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
        Geo Portal
      </h1>
      <p className="text-xl text-gray-400 text-center max-w-lg">
        Discover and create geo-anchored portals around you. Drop content anywhere in the world.
      </p>
      <div className="flex gap-4">
        <Link
          href="/portals"
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
        >
          Explore Portals
        </Link>
        <Link
          href="/portals/map"
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
        >
          View Map
        </Link>
      </div>
    </div>
  );
}
