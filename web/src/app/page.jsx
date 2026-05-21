'use client';

/**
 * Landing Page
 * Public homepage for unauthenticated users
 * Showcases RoadRescue features and CTAs to login/register
 */

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icons/logo.svg" alt="RoadRescue" className="h-10 w-10" />
            <span className="text-2xl font-bold text-red-600">RoadRescue</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 text-red-600 font-semibold hover:text-red-700"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/register')}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
            >
              Get Started
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex-1 bg-gradient-to-br from-red-50 to-red-100 px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Help When You Need It Most
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Connect drivers with nearby mechanics for fast, reliable roadside assistance powered by AI diagnostics.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/register')}
              className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-lg"
            >
              Join as Driver
            </button>
            <button
              onClick={() => router.push('/register')}
              className="px-8 py-3 bg-white text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 font-semibold text-lg"
            >
              Join as Mechanic
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Why RoadRescue?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-bold mb-2">Real-Time Location</h3>
              <p className="text-gray-600">Find mechanics near you instantly with live GPS tracking</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold mb-2">AI Diagnostics</h3>
              <p className="text-gray-600">Get instant AI analysis of your vehicle issues</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-bold mb-2">Verified Professionals</h3>
              <p className="text-gray-600">All mechanics are thoroughly verified and rated</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-red-600 px-4 py-16 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 text-red-100">
            Experience fast, reliable roadside assistance today.
          </p>
          <button
            onClick={() => router.push('/register')}
            className="px-8 py-3 bg-white text-red-600 rounded-lg hover:bg-red-50 font-semibold text-lg"
          >
            Create Your Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 px-4 py-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <p>&copy; 2026 RoadRescue. All rights reserved.</p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
