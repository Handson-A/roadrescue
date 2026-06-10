// /**
//  * Root Layout
//  * Global layout wrapper for entire application
//  * Contains Tailwind globals, fonts, providers
//  */

// import './globals.css';

// export const metadata = {
//   title: 'RoadRescue - Emergency Vehicle Assistance',
//   description: 'Fast, reliable roadside assistance for drivers and mechanics',
// };

// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <body className="bg-gray-50 text-gray-900">
//         {children}
//       </body>
//     </html>
//   );
// }


// web/src/app/layout.jsx
import '@/styles/global.css'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from 'react-hot-toast'
import { Inter, JetBrains_Mono } from 'next/font/google'

import AuthProvider from '@/providers/AuthProvider'
import { ToastProvider } from '@/components/ui/Toast'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata = {
  title: {
    default: 'RoadRescue',
    template: '%s | RoadRescue',
  },
  description:
    'Emergency roadside rescue coordination for drivers, mechanics, and administrators.',
  icons: {
    icon: '/icons/favicon.ico',
    shortcut: '/icons/favicon.ico',
    apple: '/icons/favicon.ico',
  },
}

export const viewport = {
  themeColor: '#FDFBF7',
}

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetBrainsMono.variable}`} data-scroll-behavior="smooth">
      <body className="bg-background text-foreground antialiased">
        <AuthProvider>
          <ToastProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#fff',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
                },
              }}
            />

            {children}
            <SpeedInsights />
            <Analytics />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}