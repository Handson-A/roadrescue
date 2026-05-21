'use client';

/**
 * PageWrapper Component
 * Common page container with consistent spacing
 */

export default function PageWrapper({ children, title, subtitle }) {
  return (
    <div>
      {title && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
