"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"

export default function CreateRecordPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState({
    date: "",
    content: "",
    gathering: "",
  })

  const gatherings = [
    { value: "Studio 7:30 (Cupertino)", label: "Studio 7:30 (Cupertino) : Thursday @7:30" },
    { value: "Studio 8:00 (Palo Alto)", label: "Studio 8:00 (Palo Alto) : Sunday @8:00" },
  ]
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    // Set default date to today
    if (status === "authenticated" && !formData.date) {
      const today = new Date().toISOString().split("T")[0]
      setFormData({ ...formData, date: today })
    }
  }, [status, router])

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
      console.log("Submitting form data:", formData)
      const response = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        let errorMessage = "Failed to create record. Please make sure all fields are filled."
        try {
          const data = await response.json()
          console.error("API Error Response:", data)
          console.error("Response status:", response.status)
          console.error("Response headers:", Object.fromEntries(response.headers.entries()))
          errorMessage = data?.error || errorMessage
        } catch (parseError) {
          // If response is not JSON, get text
          try {
            const text = await response.text()
            console.error("API Error Text:", text)
            errorMessage = text || errorMessage
          } catch (textError) {
            console.error("Could not read response:", textError)
            errorMessage = `Server error (${response.status}). Please try again.`
          }
        }
        setError(errorMessage)
        return
      }

      router.push("/")
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
            <div className="h-10 bg-gray-200 rounded-xl w-64 mb-10"></div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 space-y-7">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-12 bg-gray-200 rounded-xl"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-12 bg-gray-200 rounded-xl"></div>
              <div className="h-4 bg-gray-200 rounded w-40"></div>
              <div className="h-40 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10 animate-fade-in">
          <h1 className="text-5xl font-bold text-[#5C7C5C] tracking-tight mb-3">
            Create New Record
          </h1>
          <p className="text-[#6B8E6A] text-xl font-medium">Share your Studio 730 experience</p>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-[#5C7C5C]/10 p-8 sm:p-10 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-7">
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-r-xl px-5 py-4 flex items-start gap-3 shadow-sm animate-slide-in">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <span className="text-sm font-medium text-red-800 pt-1">{error}</span>
              </div>
            )}

            <div className="group">
              <label htmlFor="date" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                <svg className="w-4 h-4 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date <span className="text-red-500">*</span>
              </label>
              <input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 border-2 border-[#5C7C5C]/20 rounded-xl focus:ring-2 focus:ring-[#5C7C5C] focus:border-[#5C7C5C] transition-all duration-200 text-[#5C7C5C] bg-white/80 hover:bg-white hover:border-[#5C7C5C]/40"
              />
            </div>

            <div className="group">
              <label htmlFor="gathering" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                <svg className="w-4 h-4 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Gathering <span className="text-red-500">*</span>
              </label>
              <select
                id="gathering"
                name="gathering"
                value={formData.gathering}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 border-2 border-[#5C7C5C]/20 rounded-xl focus:ring-2 focus:ring-[#5C7C5C] focus:border-[#5C7C5C] bg-white transition-all duration-200 text-[#5C7C5C] hover:bg-[#F5F5EC] hover:border-[#5C7C5C]/40"
              >
                <option value="">Select a gathering</option>
                {gatherings.map((gathering) => (
                  <option key={gathering.value} value={gathering.value}>
                    {gathering.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="group">
              <label htmlFor="content" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                <svg className="w-4 h-4 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                What did you do in Studio 730? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows={8}
                placeholder="Describe what you did during the Studio 730 session..."
                className="w-full px-5 py-4 border-2 border-[#5C7C5C]/20 rounded-xl focus:ring-2 focus:ring-[#5C7C5C] focus:border-[#5C7C5C] transition-all duration-200 text-[#5C7C5C] placeholder-[#6B8E6A]/50 resize-y bg-white/80 hover:bg-white hover:border-[#5C7C5C]/40"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="group relative flex-1 bg-[#5C7C5C] text-white py-4 px-8 rounded-xl hover:bg-[#4A654A] focus:outline-none focus:ring-4 focus:ring-[#5C7C5C]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Record
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold shadow-sm hover:shadow"
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

