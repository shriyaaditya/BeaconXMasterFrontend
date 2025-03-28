"use client";

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Alerts', path: '/alerts' },
    { name: 'Survival Guide', path: '/guide' },
    { name: 'Inventory', path: '/inventory' },
    { name: 'Community', path: '/community' },
    { name: 'About', path: '/about' },
  ];

  return (
    <footer className="bg-gradient-to-b from-teal-500 to-teal-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center space-y-8">
          {/* Animated Logo */}
          <Link href="/" className="group flex flex-col items-center">
            <svg
              className="h-16 w-16 text-teal-50 mb-3 transition-transform group-hover:scale-105"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M32 12L44.7846 32.7692H19.2154L32 12Z" 
                fill="currentColor"
              />
              <path
                d="M32 52L44.7846 31.2308H19.2154L32 52Z"
                fill="currentColor"
              />
              <circle 
                cx="32" 
                cy="32" 
                r="8" 
                fill="#fff"
                className="animate-pulse"
              />
            </svg>
            <h2 className="text-3xl font-bold text-teal-50 tracking-tight">
              BeaconX
            </h2>
          </Link>

          {/* Quick Links Grid */}
          <div className="w-full max-w-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  className="p-3 text-teal-100 hover:text-teal-50 rounded-lg transition-all
                           hover:bg-teal-600/30 hover:underline underline-offset-4"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap justify-center gap-4 text-teal-100 text-sm">
            <Link
              href="/privacy"
              className="hover:text-teal-50 transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-teal-300">•</span>
            <Link
              href="/terms"
              className="hover:text-teal-50 transition-colors"
            >
              Terms of Service
            </Link>
            <span className="text-teal-300">•</span>
            <Link
              href="/contact"
              className="hover:text-teal-50 transition-colors"
            >
              Contact Us
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-center text-teal-200 text-sm">
            © {currentYear} BeaconX. All rights reserved.<br />
            Building safer communities through preparedness
          </p>
        </div>
      </div>
    </footer>
  );
}