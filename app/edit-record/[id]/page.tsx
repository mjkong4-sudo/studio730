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
    imageUrl: "",
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
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
        imageUrl: data.imageUrl || "",
      })
      setImagePreview(data.imageUrl || null)
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB")
      return
    }

    setUploadingImage(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to upload image")
      }

      const data = await response.json()
      setFormData(prev => ({ ...prev, imageUrl: data.url }))
      setImagePreview(data.url)
    } catch (err: any) {
      setError(err.message || "Failed to upload image")
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: "" }))
    setImagePreview(null)
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
      <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC] relative">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="animate-pulse">
            <div className="h-10 bg-[#5C7C5C]/20 rounded-xl w-64 mb-10"></div>
            <div className="glass-enhanced rounded-2xl shadow-brand-lg p-8 space-y-7">
              <div className="h-4 bg-[#5C7C5C]/20 rounded w-24"></div>
              <div className="h-12 bg-[#5C7C5C]/20 rounded-xl"></div>
              <div className="h-4 bg-[#5C7C5C]/20 rounded w-32"></div>
              <div className="h-12 bg-[#5C7C5C]/20 rounded-xl"></div>
              <div className="h-4 bg-[#5C7C5C]/20 rounded w-40"></div>
              <div className="h-40 bg-[#5C7C5C]/20 rounded-xl"></div>
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-gradient-brand tracking-tighter mb-4 leading-tight">Edit Record</h1>
          <p className="text-[#6B8E6A] text-xl md:text-2xl font-medium leading-relaxed">Update your Studio 730 record</p>
        </div>

        <div className="glass-enhanced rounded-3xl shadow-brand-xl border-2 border-[#5C7C5C]/15 p-10 sm:p-12 animate-fade-in relative z-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-r-lg flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="group">
              <label htmlFor="date" className="flex items-center gap-2 text-sm font-semibold text-[#5C7C5C] mb-3 tracking-wide uppercase">
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
                className="input-enhanced"
              />
            </div>

            <div className="group">
              <label htmlFor="gathering" className="flex items-center gap-2 text-sm font-semibold text-[#5C7C5C] mb-3 tracking-wide uppercase">
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
                className="input-enhanced hover:bg-[#F5F5EC]"
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
              <label htmlFor="content" className="flex items-center gap-2 text-sm font-semibold text-[#5C7C5C] mb-3 tracking-wide uppercase">
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
                className="input-enhanced resize-y"
              />
            </div>

            {/* Image Upload */}
            <div className="group">
              <label htmlFor="image" className="flex items-center gap-2 text-sm font-semibold text-[#5C7C5C] mb-3 tracking-wide uppercase">
                <svg className="w-4 h-4 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Image (Optional)
              </label>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-[#5C7C5C]/30 rounded-xl p-8 text-center hover:border-[#5C7C5C]/50 transition-colors">
                  <input
                    id="image"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  <label
                    htmlFor="image"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    {uploadingImage ? (
                      <>
                        <svg className="spinner h-8 w-8 text-[#5C7C5C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm text-[#6B8E6A]">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-12 h-12 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <span className="text-[#5C7C5C] font-semibold">Click to upload</span>
                          <span className="text-[#6B8E6A] text-sm block mt-1">PNG, JPG, WEBP up to 5MB</span>
                        </div>
                      </>
                    )}
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-xl border-2 border-[#5C7C5C]/20"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                    aria-label="Remove image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 py-4 px-8 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="spinner -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  "Update Record"
                )}
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

