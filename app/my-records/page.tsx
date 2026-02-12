"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import RecordsFeed from "@/components/RecordsFeed"

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

export default function MyRecordsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])

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
      fetch("/api/groups")
        .then(res => res.ok ? res.json() : { groups: [] })
        .then(data => setGroups(data.groups || []))
        .catch(() => {})
    }
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-64" />
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gradient-brand tracking-tighter mb-2">My Records</h1>
            <p className="text-[#6B8E6A] text-lg">Records you&apos;ve created</p>
          </div>
          <Link
            href="/create-record"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5C7C5C] to-[#6B8E6A] text-white px-8 py-4 rounded-xl hover:from-[#4A654A] hover:to-[#5C7C5C] font-semibold shadow-brand-lg hover:shadow-brand-xl transition-all duration-300 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Record
          </Link>
        </div>

        <RecordsFeed
          session={session}
          gatheringFilter="all"
          showGatheringFilter={true}
          availableGatherings={groups.map(g => g.name)}
          mine={true}
          emphasizeGroup={true}
          title="My Records"
          subtitle="Records you've shared across all groups"
        />
      </div>
    </div>
  )
}
