// 'use client';

// /**
//  * PageWrapper Component
//  * Common page container with consistent spacing
//  */

// export default function PageWrapper({ children, title, subtitle }) {
//   return (
//     <div>
//       {title && (
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
//           {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
//         </div>
//       )}
//       {children}
//     </div>
//   );
// }

// web/src/components/layout/PageWrapper.jsx
// Wraps every dashboard page — sidebar + main content area

// import Sidebar from './Sidebar'
// import Navbar from './Navbar'

// export default function PageWrapper({ title, children }) {
//   return (
//     <div className="flex min-h-screen bg-surface-base">
//       <Sidebar />
//       <div className="flex-1 ml-56 flex flex-col min-h-screen">
//         <Navbar title={title} />
//         <main className="flex-1 p-6">
//           {children}
//         </main>
//       </div>
//     </div>
//   )
// }

export default function PageWrapper({
  title,
  description,
  children,
}) {
  return (
    <div className="space-y-6 lg:space-y-7">
      {(title || description) && (
        <div className="flex flex-col gap-2">
          {title && <h1 className="font-display text-2xl font-semibold lg:text-3xl">{title}</h1>}
          {description && <p className="max-w-2xl text-sm leading-6 text-muted">{description}</p>}
        </div>
      )}

      {children}
    </div>
  )
}