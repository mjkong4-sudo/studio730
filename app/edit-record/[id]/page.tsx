"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Navbar from "@/components/Navbar"

export default function EditRecordPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const recordId = params.id as string
  const [formData, setFormData] = useState({
    date: "",
    content: "",
    gathering: "",
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")

  const gatherings = [
    { value: "Studio 7:30 (Cupertino)", label: "Studio 7:30 (Cupertino) : Thursday @7:30" },
    { value: "Studio 8:00 (Palo Alto)", label: "Studio 8:00 (Palo Alto) : Sunday @8:00" },
  ]

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated" && recordId) {
      fetchRecord()
    }
  }, [status, router, recordId])

  const fetchRecord = async () => {
    try {
      const response = await fetch(`/api/records/${recordId}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError("Record not found")
        } else if (response.status === 403) {
          setError("You can only edit your own records")
        } else {
          setError("Failed to load record")
        }
        return
      }
      const data = await response.json()
      
      // Format date for input field
      const date = new Date(data.date)
      const formattedDate = date.toISOString().split("T")[0]
      
      setFormData({
        date: formattedDate,
        content: data.content,
        gathering: data.gathering || "",
      })
    } catch (error) {
      console.error("Error fetching record:", error)
      setError("An error occurred while loading the record")
    } finally {
      setFetching(false)
    }
  }

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
      const response = await fetch(`/api/records/${recordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to update record")
        return
      }

      router.push("/")
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Record</h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="gathering" className="block text-sm font-medium text-gray-700 mb-2">
                Gathering *
              </label>
              <select
                id="gathering"
                name="gathering"
                value={formData.gathering}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">Select a gathering</option>
                {gatherings.map((gathering) => (
                  <option key={gathering.value} value={gathering.value}>
                    {gathering.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                What did you do in Studio 730? *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows={8}
                placeholder="Describe what you did during the Studio 730 session..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Updating..." : "Update Record"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
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

