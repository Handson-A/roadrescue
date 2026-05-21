/**
 * Root Layout
 * Global layout wrapper for entire application
 * Contains Tailwind globals, fonts, providers
 */

import './globals.css';

export const metadata = {
  title: 'RoadRescue - Emergency Vehicle Assistance',
  description: 'Fast, reliable roadside assistance for drivers and mechanics',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
