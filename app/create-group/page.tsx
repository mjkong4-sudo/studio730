"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"

export default function CreateGroupPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    day: "",
    time: "",
    description: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated" && session && !session.user.hasNickname) {
      router.push("/profile?setup=true")
      return
    }
  }, [status, session, router])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to create group")
        return
      }

      const group = await response.json()
      router.push(`/groups/${group.id}`)
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded-xl w-64 mb-10" />
            <div className="glass-enhanced rounded-2xl shadow-brand-lg p-8 space-y-7">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-12 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="mb-12 animate-fade-in">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#6B8E6A] hover:text-[#5C7C5C] font-semibold mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-5xl md:text-6xl font-bold text-gradient-brand tracking-tighter mb-4 leading-tight">
            Create New Group
          </h1>
          <p className="text-[#6B8E6A] text-xl md:text-2xl font-medium leading-relaxed">
            Add a new gathering for your community
          </p>
        </div>

        <div className="glass-enhanced rounded-3xl shadow-brand-xl border-2 border-[#5C7C5C]/15 p-10 sm:p-12 animate-fade-in relative z-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-r-xl px-5 py-4 flex items-start gap-3 shadow-sm">
                <span className="text-sm font-medium text-red-800">{error}</span>
              </div>
            )}

            <div className="group">
              <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-[#5C7C5C] mb-3 tracking-wide uppercase">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Studio 7:30 (Cupertino)"
                className="input-enhanced"
              />
            </div>

            <div className="group">
              <label htmlFor="location" className="flex items-center gap-2 text-sm font-semibold text-[#5C7C5C] mb-3 tracking-wide uppercase">
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Cupertino"
                className="input-enhanced"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="group">
                <label htmlFor="day" className="flex items-center gap-2 text-sm font-semibold text-[#5C7C5C] mb-3 tracking-wide uppercase">
                  Day
                </label>
                <input
                  id="day"
                  name="day"
                  type="text"
                  value={formData.day}
                  onChange={handleChange}
                  placeholder="e.g. Thursday"
                  className="input-enhanced"
                />
              </div>
              <div className="group">
                <label htmlFor="time" className="flex items-center gap-2 text-sm font-semibold text-[#5C7C5C] mb-3 tracking-wide uppercase">
                  Time
                </label>
                <input
                  id="time"
                  name="time"
                  type="text"
                  value={formData.time}
                  onChange={handleChange}
                  placeholder="e.g. 7:30 PM"
                  className="input-enhanced"
                />
              </div>
            </div>

            <div className="group">
              <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-[#5C7C5C] mb-3 tracking-wide uppercase">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe this gathering..."
                className="input-enhanced resize-y"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 py-4 px-8 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="spinner h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Group
                    </>
                  )}
                </span>
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary px-6 py-4"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
