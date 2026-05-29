// 'use client';

// /**
//  * Dashboard Layout
//  * Shared layout for all protected routes (driver, mechanic, admin)
//  * Includes sidebar navigation and top navbar
//  * Handles role-based access control
//  */

// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import Sidebar from '@/components/layout/Sidebar';
// import Navbar from '@/components/layout/Navbar';
// import { useAuth } from '@/hooks/useAuth';

// export default function DashboardLayout({ children }) {
//   const router = useRouter();
//   const { user, role, loading } = useAuth();

//   useEffect(() => {
//     // Redirect to login if not authenticated
//     if (!loading && !user) {
//       router.replace('/login');
//     }
//   }, [user, loading, router]);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     return null; // Redirect happens in useEffect
//   }

//   return (
//     <div className="flex h-screen bg-gray-100">
//       {/* Sidebar */}
//       <Sidebar role={role} />

//       {/* Main content */}
//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* Navbar */}
//         <Navbar user={user} role={role} />

//         {/* Page content */}
//         <main className="flex-1 overflow-auto">
//           <div className="p-8">
//             {children}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

'use client'

import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import BottomNav from '@/components/layout/BottomNav'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardLayout({
  children,
}) {
  const { role } = useAuth()
  const hasDesktopSidebar = role === 'admin' || role === 'mechanic'

  return (
    <div className="min-h-screen bg-[#F6F2E7] text-[#1f1b10]">
      <Sidebar />

      <div className={hasDesktopSidebar ? 'lg:pl-64' : ''}>
        <Navbar />

        <main className="px-4 py-5 pb-36 lg:px-6 lg:py-6 lg:pb-8">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}