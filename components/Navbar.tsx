"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()

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
    <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-700 hover:to-purple-700 transition-all duration-200">
              Studio 730
            </Link>
            <div className="hidden md:flex gap-2">
              <Link
                href="/"
                className="text-gray-700 hover:text-indigo-600 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-indigo-50"
              >
                Dashboard
              </Link>
              <Link
                href="/create-record"
                className="text-gray-700 hover:text-indigo-600 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-indigo-50"
              >
                Add Record
              </Link>
              <Link
                href="/profile"
                className="text-gray-700 hover:text-indigo-600 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-indigo-50"
              >
                Profile
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {displayName}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

