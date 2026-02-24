"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"

interface Project {
  id: string
  name: string
  description: string | null
  createdAt: string
}

export default function ProjectsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

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
      fetch("/api/projects")
        .then(res => res.ok ? res.json() : { projects: [] })
        .then(data => setProjects(data.projects || []))
        .catch(() => setProjects([]))
        .finally(() => setLoading(false))
    }
  }, [status, session, router])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC] relative">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-brand tracking-tighter mb-2">
            My Projects
          </h1>
          <p className="text-[#6B8E6A] text-lg">
            View your records by personal project
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="glass-enhanced rounded-3xl shadow-brand-xl border-2 border-[#5C7C5C]/15 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#5C7C5C]/20 to-[#6B8E6A]/20 rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gradient-subtle mb-4">No projects yet</h2>
              <p className="text-[#6B8E6A] mb-8">
                Create a project when adding a record to organize your work (e.g. Writing, Art).
              </p>
              <Link
                href="/create-record"
                className="btn-primary inline-flex items-center gap-2"
              >
                Create Record
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="glass-enhanced rounded-2xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-8 hover:border-[#5C7C5C]/40 hover:shadow-brand-xl transition-all duration-300 card-lift block animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#5C7C5C] to-[#6B8E6A] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {project.name[0]?.toUpperCase() || "P"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gradient-subtle truncate">{project.name}</h3>
                    {project.description && (
                      <p className="text-[#6B8E6A] text-sm mt-1 line-clamp-2">{project.description}</p>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-[#5C7C5C] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
