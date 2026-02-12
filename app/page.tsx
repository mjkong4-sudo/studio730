"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"

interface Group {
  id: string
  name: string
  location: string
  day: string
  time: string
  description: string
  stats: {
    recordCount: number
    memberCount: number
    lastActivity: string | null
    lastActivityBy: string | null
  }
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated" && session) {
      if (!session.user.hasNickname) {
        router.push("/profile?setup=true")
        return
      }
      fetchGroups()
    }
  }, [status, session, router])

  const fetchGroups = async () => {
    try {
      setLoadingGroups(true)
      const response = await fetch("/api/groups")
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups || [])
      }
    } catch (error) {
      console.error("Error fetching groups:", error)
    } finally {
      setLoadingGroups(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-64 mb-8" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC] relative">
      <div className="decorative-circle w-96 h-96 top-0 right-0 opacity-30" />
      <div className="decorative-circle w-64 h-64 bottom-20 left-10 opacity-20" />

      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
        <div className="mb-12 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 mb-12">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-gradient-brand tracking-tighter mb-4 leading-tight">
                Studio 730
              </h1>
              <p className="text-[#6B8E6A] text-xl md:text-2xl font-medium leading-relaxed">
                Connect with your community groups
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard"
                className="group inline-flex items-center justify-center bg-white/80 border-2 border-[#5C7C5C]/30 text-[#5C7C5C] px-8 py-4 rounded-xl hover:border-[#5C7C5C] hover:bg-[#5C7C5C]/10 focus:outline-none focus:ring-4 focus:ring-[#5C7C5C]/30 transition-all duration-300 font-bold text-base shadow-md hover:shadow-lg"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Dashboard
                </span>
              </Link>
              <Link
                href="/create-record"
                className="group inline-flex items-center justify-center bg-gradient-to-r from-[#5C7C5C] to-[#6B8E6A] text-white px-8 py-4 rounded-xl hover:from-[#4A654A] hover:to-[#5C7C5C] focus:outline-none focus:ring-4 focus:ring-[#5C7C5C]/30 transition-all duration-300 shadow-brand-lg hover:shadow-brand-xl hover:scale-105 active:scale-95 font-bold text-base relative overflow-hidden glow-effect ripple-effect"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Record
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </Link>
            </div>
          </div>

          {/* Groups Overview Section */}
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gradient-subtle mb-6 tracking-tight">
              Our Groups
            </h2>
            <p className="text-[#6B8E6A] text-lg mb-8">
              Click on a group to see its records
            </p>
            {loadingGroups ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map(i => (
                  <div key={i} className="glass-enhanced rounded-2xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-8 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-6" />
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groups.map((group, index) => (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className="glass-enhanced rounded-2xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-8 hover:border-[#5C7C5C]/40 hover:shadow-brand-xl transition-all duration-300 group card-lift animate-fade-in block"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl md:text-3xl font-bold text-gradient-subtle mb-2 tracking-tight group-hover:text-[#5C7C5C] transition-colors">
                          {group.name}
                        </h3>
                        <div className="flex items-center gap-3 text-[#6B8E6A] mb-4">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm font-medium">{group.location}</span>
                          </div>
                          <span className="text-[#5C7C5C]">•</span>
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-medium">{group.day} @ {group.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#5C7C5C] to-[#6B8E6A] flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                          {group.name.includes("7:30") ? "7:30" : "8:00"}
                        </div>
                      </div>
                    </div>

                    <p className="text-[#6B8E6A] text-sm mb-6 leading-relaxed">{group.description}</p>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[#5C7C5C]/20">
                      <div>
                        <div className="text-2xl font-bold text-gradient-subtle mb-1">{group.stats.recordCount}</div>
                        <div className="text-xs text-[#6B8E6A] uppercase tracking-wide">Records</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gradient-subtle mb-1">{group.stats.memberCount}</div>
                        <div className="text-xs text-[#6B8E6A] uppercase tracking-wide">Members</div>
                      </div>
                    </div>

                    {group.stats.lastActivity && (
                      <div className="mt-4 pt-4 border-t border-[#5C7C5C]/10">
                        <div className="text-xs text-[#6B8E6A]">
                          Last activity:{" "}
                          <span className="font-semibold text-[#5C7C5C]">
                            {new Date(group.stats.lastActivity).toLocaleDateString()}
                          </span>
                          {group.stats.lastActivityBy && (
                            <span> by {group.stats.lastActivityBy}</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-[#5C7C5C]/10">
                      <div className="flex items-center gap-2 text-[#5C7C5C] text-sm font-semibold group-hover:text-[#4A654A] transition-colors">
                        <span>View records</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="glass-enhanced rounded-2xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-8 text-center">
                <p className="text-[#6B8E6A]">No groups available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
