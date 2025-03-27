"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, LogIn, UserPlus, Home, Bell, BookOpen, Package, Users, Info } from "lucide-react"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  // Navigation links with icons
  const navLinks = [
    { name: "Home", path: "/", icon: <Home className="h-5 w-5" /> },
    { name: "Alerts", path: "/alerts", icon: <Bell className="h-5 w-5" /> },
    { name: "Survival Guide", path: "/guide", icon: <BookOpen className="h-5 w-5" /> },
    { name: "Inventory", path: "/inventory", icon: <Package className="h-5 w-5" /> },
    { name: "Community", path: "/community", icon: <Users className="h-5 w-5" /> },
    { name: "About", path: "/about", icon: <Info className="h-5 w-5" /> },
  ]

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-gradient-to-r from-[#45a247] to-[#283c86] backdrop-blur-sm shadow-lg"
          : "bg-gradient-to-r from-[#45a247] to-[#283c86] backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex h-20">
          {/* CLUSTER 1: Logo with SVG animation */}
          <div className="flex items-center justify-start w-1/4 border-r border-white/10 pr-6">
            <Link href="/" className="group flex items-center space-x-3">
              <div className="relative h-12 w-12 transition-transform duration-500 group-hover:scale-110">
                <svg
                  className="h-12 w-12 text-white"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Outer glow */}
                  <circle cx="32" cy="32" r="30" fill="url(#radialGradient)" className="opacity-20" />

                  {/* Beacon rays - animated */}
                  <circle
                    cx="32"
                    cy="32"
                    r="24"
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    className="animate-[spin_20s_linear_infinite]"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="16"
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    className="animate-[spin_15s_linear_infinite_reverse]"
                  />

                  {/* Beacon triangle */}
                  <path d="M32 12L44.7846 32.7692H19.2154L32 12Z" fill="currentColor" className="drop-shadow-md" />
                  <path d="M32 52L44.7846 31.2308H19.2154L32 52Z" fill="currentColor" className="drop-shadow-md" />

                  {/* Beacon light - animated */}
                  <circle cx="32" cy="32" r="8" fill="white" className="animate-[pulse_2s_ease-in-out_infinite]" />

                  {/* Beacon pole */}
                  <path
                    d="M32 8L32 56"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="drop-shadow-md"
                  />

                  {/* Define gradient */}
                  <defs>
                    <radialGradient id="radialGradient" cx="0.5" cy="0.5" r="0.5">
                      <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                </svg>
              </div>
              <div className="font-bold text-2xl text-white transition-all duration-300 group-hover:text-sky-100">
                Beacon<span className="text-sky-200">X</span>
              </div>
            </Link>
          </div>

          {/* CLUSTER 3: Navigation Links (centered) */}
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="flex items-center space-x-2 px-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.path
                return (
                  <Link
                    key={link.name}
                    href={link.path}
                    className={`flex items-center space-x-2 mx-1 px-4 py-2.5 rounded-md
                      transition-all duration-300 text-white/90 hover:text-white
                      relative group overflow-hidden ${isActive ? "bg-white/15 text-white" : ""}`}
                  >
                    <span className="relative z-10 transition-transform group-hover:scale-110 duration-300">
                      {link.icon}
                    </span>
                    <span className="relative z-10 font-medium">{link.name}</span>

                    {/* Hover background effect (only show if not active) */}
                    {!isActive && (
                      <span
                        className="absolute inset-0 bg-white/0 group-hover:bg-white/15 
                        transition-all duration-300 transform translate-y-full group-hover:translate-y-0 rounded-md"
                      ></span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* CLUSTER 2: Login/Register */}
          <div className="hidden md:flex items-center justify-end w-1/4 border-l border-white/10 pl-6">
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-md
                  transition-all duration-300 text-white/90 hover:text-white
                  border border-white/20 hover:border-white/40 relative group overflow-hidden"
                aria-label="Login"
              >
                <span className="relative z-10 transition-transform group-hover:scale-110 duration-300">
                  <LogIn className="h-5 w-5" />
                </span>
                <span className="relative z-10">Login</span>

                {/* Hover background effect */}
                <span
                  className="absolute inset-0 bg-white/0 group-hover:bg-white/15 
                  transition-all duration-300 transform translate-y-full group-hover:translate-y-0 rounded-md"
                ></span>
              </Link>
              <Link
                href="/register"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-md 
                  bg-sky-500 text-white relative group overflow-hidden
                  transition-all duration-300 shadow-lg shadow-sky-500/20"
                aria-label="Register"
              >
                <span className="relative z-10 transition-transform group-hover:scale-110 duration-300">
                  <UserPlus className="h-5 w-5" />
                </span>
                <span className="relative z-10">Register</span>

                {/* Hover background effect */}
                <span
                  className="absolute inset-0 bg-sky-400/0 group-hover:bg-sky-400 
                  transition-all duration-300 transform translate-y-full group-hover:translate-y-0 rounded-md"
                ></span>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center justify-end flex-1">
            <button
              className="p-2 rounded-lg transition-colors duration-300
                hover:bg-white/10 focus:outline-none"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="h-7 w-7 transition-transform duration-300" />
              ) : (
                <Menu className="h-7 w-7 transition-transform duration-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {/* Mobile Navigation Links */}
          <div className="py-3 border-t border-white/10">
            <div className="grid grid-cols-1 gap-2 px-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.path
                return (
                  <Link
                    key={link.name}
                    href={link.path}
                    className={`flex items-center space-x-3 px-4 py-3.5 rounded-md 
                      transition-all duration-300 hover:bg-white/15 group
                      ${isActive ? "bg-white/15 text-white" : ""}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="text-white/80 transition-transform group-hover:scale-110 duration-300">
                      {link.icon}
                    </span>
                    <span className="font-medium">{link.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Mobile Login/Register */}
          <div className="py-4 border-t border-white/10 flex space-x-3 px-1">
            <Link
              href="/login"
              className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg 
                border border-white/20 transition-all duration-300 hover:bg-white/10"
              onClick={() => setIsOpen(false)}
            >
              <LogIn className="h-5 w-5" />
              <span>Login</span>
            </Link>
            <Link
              href="/register"
              className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg 
                bg-sky-500 hover:bg-sky-400 transition-all duration-300"
              onClick={() => setIsOpen(false)}
            >
              <UserPlus className="h-5 w-5" />
              <span>Register</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

