'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Map, Plus, Trophy, User, LogOut, Compass } from 'lucide-react';

export function Navbar() {
  const { user, logout, loading } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Geo Portal
        </Link>

        <div className="flex items-center gap-1">
          <NavLink href="/portals" icon={<Compass className="w-4 h-4" />} label="Explore" />
          <NavLink href="/portals/map" icon={<Map className="w-4 h-4" />} label="Map" />
          {user && (
            <>
              <NavLink href="/portals/create" icon={<Plus className="w-4 h-4" />} label="Create" />
              <NavLink href="/my-portals" icon={<User className="w-4 h-4" />} label="My Portals" />
            </>
          )}
          <NavLink href="/leaderboard" icon={<Trophy className="w-4 h-4" />} label="Leaderboard" />

          {!loading && (
            user ? (
              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Login
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
