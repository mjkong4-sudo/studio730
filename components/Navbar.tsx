"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import Notifications from "./Notifications"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/my-records", label: "My Records" }
]

export default function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  if (!session) {
    return null
  }

  // Get initials for avatar
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const displayName = session.user.nickname || session.user.email?.split("@")[0] || "User"
  const initials = session.user.nickname 
    ? getInitials(session.user.nickname)
    : session.user.email
    ? session.user.email[0].toUpperCase()
    : "U"

  return (
    <nav className="bg-white/90 backdrop-blur-xl border-b border-[#5C7C5C]/10 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-display text-xl md:text-2xl font-bold text-gradient-subtle hover:text-gradient-brand transition-all duration-200 tracking-tight">
              Studio 730
            </Link>
            <div className="hidden md:flex gap-2">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${
                    pathname === href ? "bg-[#5C7C5C]/20 text-[#5C7C5C]" : "text-[#6B8E6A] hover:text-[#5C7C5C] hover:bg-[#5C7C5C]/10"
                  }`}
                  aria-current={pathname === href ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}
              {session.user.role === "admin" && (
                <Link
                  href="/admin"
                  className={`px-4 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${
                    pathname === "/admin" ? "bg-[#5C7C5C]/20 text-[#5C7C5C]" : "text-[#6B8E6A] hover:text-[#5C7C5C] hover:bg-[#5C7C5C]/10"
                  }`}
                  aria-current={pathname === "/admin" ? "page" : undefined}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Notifications />
            <Link
              href="/profile"
              className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 rounded-xl bg-[#F5F5EC] hover:bg-[#5C7C5C]/10 transition-colors"
              aria-current={pathname === "/profile" ? "page" : undefined}
            >
              <div className="avatar-gradient w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0">
                {initials}
              </div>
              <span className="text-sm font-semibold text-[#5C7C5C] hidden sm:inline">
                {displayName}
              </span>
            </Link>
            <button
              onClick={handleSignOut}
              className="hidden md:inline-flex btn-secondary px-4 py-2 text-sm"
            >
              Sign Out
            </button>
            {/* Mobile menu button - on right */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#5C7C5C] hover:bg-[#5C7C5C]/10 transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#5C7C5C]/10 bg-white/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  pathname === href ? "bg-[#5C7C5C]/20 text-[#5C7C5C]" : "text-[#6B8E6A] hover:bg-[#5C7C5C]/10"
                }`}
                aria-current={pathname === href ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
            {session.user.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  pathname === "/admin" ? "bg-[#5C7C5C]/20 text-[#5C7C5C]" : "text-[#6B8E6A] hover:bg-[#5C7C5C]/10"
                }`}
                aria-current={pathname === "/admin" ? "page" : undefined}
              >
                Admin
              </Link>
            )}
            <div className="mt-4 pt-4 border-t border-[#5C7C5C]/20">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleSignOut()
                }}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-[#6B8E6A] hover:bg-red-50 hover:text-red-600 transition-colors text-left"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

