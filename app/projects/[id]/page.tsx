"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import RecordsFeed from "@/components/RecordsFeed"

export default function ProjectDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params?.id as string
  const [project, setProject] = useState<{ id: string; name: string; description: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

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
      fetch("/api/projects/" + projectId)
        .then(res => {
          if (!res.ok) {
            setNotFound(true)
            return null
          }
          return res.json()
        })
        .then(data => {
          if (data) setProject(data)
        })
        .catch(() => setNotFound(true))
        .finally(() => setLoading(false))
    }
  }, [status, session, router, projectId])

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

  if (notFound || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-3xl font-bold text-gradient-brand mb-4">Project not found</h1>
          <p className="text-[#6B8E6A] mb-8">This project doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Link href="/projects" className="btn-primary">
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC] relative">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="mb-12 animate-fade-in">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-[#6B8E6A] hover:text-[#5C7C5C] font-semibold mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </Link>
          <div className="glass-enhanced rounded-2xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#5C7C5C] to-[#6B8E6A] flex items-center justify-center text-white text-2xl font-bold">
                {project.name[0]?.toUpperCase() || "P"}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gradient-subtle">{project.name}</h1>
                {project.description && (
                  <p className="text-[#6B8E6A] mt-2">{project.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <RecordsFeed
          session={session}
          projectIdFilter={projectId}
          mine={true}
          title={`Records in ${project.name}`}
          subtitle="Your records tagged with this project"
        />
      </div>
    </div>
  )
}
