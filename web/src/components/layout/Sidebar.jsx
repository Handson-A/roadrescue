'use client';

/**
 * Sidebar Component
 * Dashboard navigation sidebar with role-based menu
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ role = 'driver' }) {
  const pathname = usePathname();

  const menuItems =
    role === 'driver'
      ? [
          { href: '/driver', label: '📋 Requests', icon: 'chart' },
          { href: '/driver/history', label: '📜 History', icon: 'history' },
        ]
      : role === 'mechanic'
      ? [
          { href: '/mechanic', label: '⚙️ Jobs', icon: 'jobs' },
          { href: '/mechanic/history', label: '✅ Completed', icon: 'completed' },
        ]
      : [
          { href: '/admin', label: '📊 Dashboard', icon: 'dashboard' },
          { href: '/admin/mechanics', label: '🔧 Verify Mechanics', icon: 'verify' },
          { href: '/admin/requests', label: '📋 All Requests', icon: 'requests' },
          { href: '/admin/users', label: '👥 Users', icon: 'users' },
        ];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700 flex items-center gap-3">
        <img src="/icons/logo.svg" alt="RoadRescue" className="h-8 w-8" />
        <span className="text-xl font-bold">RoadRescue</span>
      </div>

      {/* Logo on mobile */}
      <div className="hidden md:flex p-6 border-b border-gray-700 flex-col flex-1">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 rounded-lg transition ${
                pathname === item.href
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
