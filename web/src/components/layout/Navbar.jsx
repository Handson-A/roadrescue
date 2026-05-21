'use client';

/**
 * Navbar Component
 * Top navigation bar with user profile and controls
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/ui/Avatar';

export default function Navbar({ user, role }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    // Clear auth and redirect to login
    sessionStorage.removeItem('auth_token');
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {role === 'driver' && 'Driver Dashboard'}
          {role === 'mechanic' && 'Mechanic Dashboard'}
          {role === 'admin' && 'Admin Dashboard'}
        </h1>
      </div>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <Avatar src={user?.avatar} alt={user?.name} size="sm" />
          <span className="text-sm font-semibold text-gray-900">{user?.name}</span>
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <a
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Profile
            </a>
            <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Settings
            </a>
            <hr className="my-2" />
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
