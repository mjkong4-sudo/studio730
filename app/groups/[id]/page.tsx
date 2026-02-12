"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import RecordsFeed from "@/components/RecordsFeed"
import { getGroupById } from "@/lib/groups"

interface GroupWithStats {
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

export default function GroupPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const groupId = params?.id as string
  const [group, setGroup] = useState<GroupWithStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const staticGroup = getGroupById(groupId)

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
      if (!staticGroup) {
        setNotFound(true)
        setLoading(false)
        return
      }
      fetchGroupWithStats()
    }
  }, [status, session, router, groupId, staticGroup])

  const fetchGroupWithStats = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/groups")
      if (response.ok) {
        const data = await response.json()
        const found = (data.groups || []).find((g: GroupWithStats) => g.id === groupId)
        setGroup(found || null)
        if (!found) setNotFound(true)
      } else {
        setGroup(null)
        setNotFound(true)
      }
    } catch (error) {
      console.error("Error fetching group:", error)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || (loading && !notFound)) {
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

  if (notFound || !staticGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-3xl font-bold text-gradient-brand mb-4">Group not found</h1>
          <p className="text-[#6B8E6A] mb-8">The group you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const groupName = group?.name ?? staticGroup.name

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC] relative">
      <div className="decorative-circle w-96 h-96 top-0 right-0 opacity-30" />
      <div className="decorative-circle w-64 h-64 bottom-20 left-10 opacity-20" />

      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
        <div className="mb-12 animate-fade-in">
          <Link href="/" className="inline-flex items-center gap-2 text-[#6B8E6A] hover:text-[#5C7C5C] font-semibold mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>

          <div className="glass-enhanced rounded-2xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-8 mb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gradient-subtle mb-3">{groupName}</h1>
                <div className="flex flex-wrap items-center gap-4 text-[#6B8E6A] mb-4">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {staticGroup.location}
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {staticGroup.day} @ {staticGroup.time}
                  </span>
                </div>
                <p className="text-[#6B8E6A]">{staticGroup.description}</p>
                {group?.stats && (
                  <div className="flex gap-6 mt-6 pt-6 border-t border-[#5C7C5C]/20">
                    <div>
                      <div className="text-2xl font-bold text-gradient-subtle">{group.stats.recordCount}</div>
                      <div className="text-xs text-[#6B8E6A] uppercase tracking-wide">Records</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gradient-subtle">{group.stats.memberCount}</div>
                      <div className="text-xs text-[#6B8E6A] uppercase tracking-wide">Members</div>
                    </div>
                  </div>
                )}
              </div>
              <Link
                href="/create-record"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5C7C5C] to-[#6B8E6A] text-white px-6 py-3 rounded-xl hover:from-[#4A654A] hover:to-[#5C7C5C] font-semibold shadow-brand-lg transition-all duration-300 hover:scale-105 self-start"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Record
              </Link>
            </div>
          </div>
        </div>

        <RecordsFeed
          session={session}
          gatheringFilter={groupName}
          showGatheringFilter={false}
          title={`Records from ${groupName}`}
          subtitle="See what members are sharing in this group"
        />
      </div>
    </div>
  )
}
