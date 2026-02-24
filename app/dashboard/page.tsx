"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import RecordsFeed from "@/components/RecordsFeed"
import CalendarView from "@/components/CalendarView"
import TimelineView from "@/components/TimelineView"

interface Group {
  id: string
  name: string
  location?: string | null
  day?: string | null
  time?: string | null
  description?: string | null
  stats: {
    recordCount: number
    memberCount: number
    lastActivity: string | null
    lastActivityBy: string | null
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "timeline">("list")
  const [selectedGathering, setSelectedGathering] = useState("all")
  const [selectedProject, setSelectedProject] = useState("all")

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
      const [groupsRes, projectsRes] = await Promise.all([
        fetch("/api/groups"),
        fetch("/api/projects"),
      ])
      if (groupsRes.ok) {
        const data = await groupsRes.json()
        setGroups(data.groups || [])
      }
      if (projectsRes.ok) {
        const data = await projectsRes.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error("Error fetching groups:", error)
    } finally {
      setLoadingGroups(false)
    }
  }

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

  const availableGatherings = groups.map(g => g.name)

  const viewTabs = [
    { id: "list" as const, label: "List", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
    { id: "calendar" as const, label: "Calendar", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { id: "timeline" as const, label: "Timeline", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC] relative">
      <div className="decorative-circle w-96 h-96 top-0 right-0 opacity-30" />
      <div className="decorative-circle w-64 h-64 bottom-20 left-10 opacity-20" />

      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gradient-brand tracking-tighter mb-2">Dashboard</h1>
            <p className="text-[#6B8E6A] text-lg">All records from all groups</p>
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

        <div className="glass-enhanced rounded-2xl border-2 border-[#5C7C5C]/15 p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex rounded-xl overflow-hidden border-2 border-[#5C7C5C]/20">
              {viewTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={`px-6 py-3 text-sm font-semibold flex items-center gap-2 transition-colors ${
                    viewMode === tab.id
                      ? "bg-[#5C7C5C] text-white"
                      : "bg-white/80 text-[#6B8E6A] hover:bg-[#5C7C5C]/10"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>
            {(viewMode === "calendar" || viewMode === "timeline") && (
              <div className="flex gap-4 flex-wrap">
                <select
                  value={selectedGathering}
                  onChange={e => setSelectedGathering(e.target.value)}
                  className="py-2 px-4 rounded-xl border-2 border-[#5C7C5C]/20 text-sm text-[#5C7C5C]"
                >
                  <option value="all">All Groups</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
                <select
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                  className="py-2 px-4 rounded-xl border-2 border-[#5C7C5C]/20 text-sm text-[#5C7C5C]"
                >
                  <option value="all">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {viewMode === "list" && (
          <RecordsFeed
            session={session}
            gatheringFilter="all"
            showGatheringFilter={true}
            showProjectFilter={true}
            availableGatherings={availableGatherings}
            availableProjects={projects}
            title="Recent Records"
            subtitle="See what members are sharing across all groups"
          />
        )}
        {viewMode === "calendar" && (
          <div>
            <h2 className="text-2xl font-bold text-gradient-subtle mb-6">Calendar View</h2>
            <CalendarView
              session={session}
              gatheringFilter={selectedGathering !== "all" ? selectedGathering : undefined}
              projectIdFilter={selectedProject !== "all" ? selectedProject : undefined}
            />
          </div>
        )}
        {viewMode === "timeline" && (
          <div>
            <h2 className="text-2xl font-bold text-gradient-subtle mb-6">Timeline View</h2>
            <TimelineView
              session={session}
              gatheringFilter={selectedGathering !== "all" ? selectedGathering : undefined}
              projectIdFilter={selectedProject !== "all" ? selectedProject : undefined}
            />
          </div>
        )}
      </div>
    </div>
  )
}
