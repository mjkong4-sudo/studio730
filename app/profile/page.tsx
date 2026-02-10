"use client"

import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Navbar from "@/components/Navbar"

interface ProfileData {
  nickname: string | null
  firstName: string | null
  lastName: string | null
  city: string | null
  country: string | null
  bio: string | null
}

function ProfilePageContent() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSetup = searchParams.get("setup") === "true"
  const [formData, setFormData] = useState<ProfileData>({
    nickname: "",
    firstName: "",
    lastName: "",
    city: "",
    country: "",
    bio: "",
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteEmail, setDeleteEmail] = useState("")
  const [hasPassword, setHasPassword] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        setFormData({
          nickname: data.nickname || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          city: data.city || "",
          country: data.country || "",
          bio: data.bio || "",
        })
        // Check if user has a password by trying to fetch user data
        // We'll check this by attempting to get the user's email
        // If the account was created before password auth, password will be null
        if (session?.user?.email) {
          // Check if this is a legacy account (no password)
          // We'll determine this when user tries to delete
          setDeleteEmail(session.user.email)
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setFetching(false)
    }
  }

  // Check if user has password when delete confirmation is shown
  useEffect(() => {
    if (showDeleteConfirm && session?.user?.email) {
      // Check if account has password by making a test request
      // For now, we'll assume accounts without passwords need email confirmation
      // This will be determined by the API response
      setDeleteEmail(session.user.email)
    }
  }, [showDeleteConfirm, session])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to update profile")
        return
      }

      // Update the session to reflect nickname changes
      await update()
      
      setSuccess("Profile updated successfully!")
      
      // If this was a setup flow, redirect to dashboard after a moment
      if (isSetup && formData.nickname?.trim()) {
        setTimeout(() => {
          router.push("/")
          router.refresh() // Force a refresh to ensure session is updated
        }, 1500)
      } else {
        setTimeout(() => setSuccess(""), 3000)
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || fetching) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  // Get initials for avatar
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const displayName = session.user.nickname || session.user.email?.split("@")[0] || "User"
  const initials = session.user.nickname 
    ? getInitials(session.user.nickname)
    : formData.firstName && formData.lastName
    ? getInitials(`${formData.firstName} ${formData.lastName}`)
    : session.user.email
    ? session.user.email[0].toUpperCase()
    : "U"

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC] relative">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 animate-fade-in">
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-[#5C7C5C] flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-white">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#6B8E6A] rounded-full border-4 border-white shadow-sm"></div>
            </div>
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-gradient-brand tracking-tighter mb-3 leading-tight">
                {isSetup ? "Welcome!" : displayName}
              </h1>
              {!isSetup && (
                <p className="text-[#6B8E6A] text-lg md:text-xl font-medium leading-relaxed">{session.user.email}</p>
              )}
            </div>
          </div>
          {!isSetup && <p className="text-[#6B8E6A] text-lg ml-26 leading-relaxed">Manage your account settings</p>}
        </div>
        
        {isSetup && (
          <div className="mb-8 animate-slide-in">
            <div className="bg-[#5C7C5C] rounded-2xl p-6 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                </div>
                <div>
                  <p className="text-white font-bold text-lg md:text-xl mb-2 tracking-tight">Welcome to Studio 730!</p>
                  <p className="text-white/90 text-sm md:text-base leading-relaxed">Please set up your profile first. Start by adding a nickname so others can identify you in posts.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="glass-enhanced rounded-3xl shadow-brand-xl border-2 border-[#5C7C5C]/15 p-10 sm:p-12 animate-fade-in relative z-10">
          <div className="mb-10 pb-10 border-b-2 border-[#5C7C5C]/20">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-5 h-5 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-xs font-semibold text-[#6B8E6A] uppercase tracking-wider">Email Address</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gradient-subtle ml-8 tracking-tight">{session.user.email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
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

            {success && (
              <div className="bg-gradient-to-r from-[#5C7C5C]/10 to-[#6B8E6A]/10 border-l-4 border-[#5C7C5C] rounded-r-xl px-5 py-4 flex items-start gap-3 shadow-sm animate-slide-in">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-[#5C7C5C] rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <span className="text-sm font-medium text-[#5C7C5C] pt-1">{success}</span>
              </div>
            )}

            <div className="group">
              <label htmlFor="nickname" className="flex items-center gap-2 text-sm font-semibold text-[#5C7C5C] mb-3 tracking-wide uppercase">
                <svg className="w-4 h-4 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Nickname {isSetup && <span className="text-red-500">*</span>}
              </label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                value={formData.nickname || ""}
                onChange={handleChange}
                required={isSetup}
                className="input-enhanced"
                placeholder="Choose a nickname"
              />
              {isSetup && (
                <p className="mt-2 text-sm text-gray-500 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  This will be displayed instead of your email in posts and comments.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="group">
                <label htmlFor="firstName" className="flex items-center gap-2 text-sm font-semibold text-[#5C7C5C] mb-3 tracking-wide uppercase">
                  <svg className="w-4 h-4 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName || ""}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border-2 border-[#5C7C5C]/20 rounded-xl focus:ring-2 focus:ring-[#5C7C5C] focus:border-[#5C7C5C] transition-all duration-200 text-[#5C7C5C] bg-white/80 hover:bg-white hover:border-[#5C7C5C]/40"
                  placeholder="John"
                />
              </div>

              <div className="group">
                <label htmlFor="lastName" className="flex items-center gap-2 text-sm font-semibold text-[#5C7C5C] mb-3 tracking-wide uppercase">
                  <svg className="w-4 h-4 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName || ""}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border-2 border-[#5C7C5C]/20 rounded-xl focus:ring-2 focus:ring-[#5C7C5C] focus:border-[#5C7C5C] transition-all duration-200 text-[#5C7C5C] bg-white/80 hover:bg-white hover:border-[#5C7C5C]/40"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="group">
                <label htmlFor="city" className="flex items-center gap-2 text-sm font-semibold text-[#5C7C5C] mb-3 tracking-wide uppercase">
                  <svg className="w-4 h-4 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city || ""}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border-2 border-[#5C7C5C]/20 rounded-xl focus:ring-2 focus:ring-[#5C7C5C] focus:border-[#5C7C5C] transition-all duration-200 text-[#5C7C5C] bg-white/80 hover:bg-white hover:border-[#5C7C5C]/40"
                  placeholder="San Francisco"
                />
              </div>

              <div className="group">
                <label htmlFor="country" className="flex items-center gap-2 text-sm font-semibold text-[#5C7C5C] mb-3 tracking-wide uppercase">
                  <svg className="w-4 h-4 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002 2h2.945M15 11a3 3 0 11-6 0m6 0a3 3 0 10-6 0m6 0h.01M21 11a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={formData.country || ""}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border-2 border-[#5C7C5C]/20 rounded-xl focus:ring-2 focus:ring-[#5C7C5C] focus:border-[#5C7C5C] transition-all duration-200 text-[#5C7C5C] bg-white/80 hover:bg-white hover:border-[#5C7C5C]/40"
                  placeholder="United States"
                />
              </div>
            </div>

            <div className="group">
              <label htmlFor="bio" className="flex items-center gap-2 text-sm font-semibold text-[#5C7C5C] mb-3 tracking-wide uppercase">
                <svg className="w-4 h-4 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio || ""}
                onChange={handleChange}
                rows={5}
                className="input-enhanced resize-y"
                placeholder="Tell us about yourself..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || (isSetup && !formData.nickname?.trim())}
              className="btn-primary w-full py-4 px-8 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="spinner h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isSetup ? "Setting up..." : "Updating..."}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {isSetup ? "Complete Setup" : "Update Profile"}
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Delete Account Section */}
          {!isSetup && (
            <div className="mt-12 pt-12 border-t-2 border-red-200">
              <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-8 border-2 border-red-200">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-red-800 mb-2">Danger Zone</h3>
                    <p className="text-red-700 text-sm mb-4">
                      Once you delete your account, there is no going back. This will permanently delete your account, 
                      all your records, comments, and reactions. This action cannot be undone.
                    </p>
                    
                    {!showDeleteConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold transition-colors shadow-md hover:shadow-lg"
                      >
                        Delete My Account
                      </button>
                    ) : (
                      <div className="space-y-4">
                        {hasPassword ? (
                          <div>
                            <label htmlFor="deletePassword" className="block text-sm font-semibold text-red-800 mb-2">
                              Enter your password to confirm deletion
                            </label>
                            <input
                              id="deletePassword"
                              type="password"
                              value={deletePassword}
                              onChange={(e) => setDeletePassword(e.target.value)}
                              placeholder="Your password"
                              className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-red-900 bg-white"
                            />
                          </div>
                        ) : (
                          <div>
                            <label htmlFor="deleteEmail" className="block text-sm font-semibold text-red-800 mb-2">
                              Enter your email address to confirm deletion
                            </label>
                            <p className="text-xs text-red-700 mb-2">
                              Your account was created before password authentication was added. Please enter your email address to confirm deletion.
                            </p>
                            <input
                              id="deleteEmail"
                              type="email"
                              value={deleteEmail}
                              onChange={(e) => setDeleteEmail(e.target.value)}
                              placeholder={session?.user?.email || "your@email.com"}
                              className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-red-900 bg-white"
                            />
                            <p className="text-xs text-red-600 mt-2">
                              Your email: <span className="font-semibold">{session?.user?.email}</span>
                            </p>
                          </div>
                        )}
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleDeleteAccount}
                            disabled={(hasPassword ? !deletePassword : !deleteEmail) || deleting}
                            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleting ? "Deleting..." : "Confirm Deletion"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowDeleteConfirm(false)
                              setDeletePassword("")
                              setDeleteEmail(session?.user?.email || "")
                              setError("")
                            }}
                            disabled={deleting}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  async function handleDeleteAccount() {
    if (hasPassword && !deletePassword) {
      setError("Please enter your password to confirm deletion")
      return
    }

    if (!hasPassword && !deleteEmail) {
      setError("Please enter your email address to confirm deletion")
      return
    }

    setDeleting(true)
    setError("")

    try {
      const requestBody = hasPassword 
        ? { password: deletePassword }
        : { confirmEmail: deleteEmail }

      const response = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if error indicates account has no password
        if (data.error?.includes("no password") || data.error?.includes("Email confirmation")) {
          setHasPassword(false)
          setError("") // Clear error, show email input instead
        } else {
          setError(data.error || "Failed to delete account")
        }
        setDeleting(false)
        return
      }

      // Sign out and redirect to home
      await signOut({ callbackUrl: "/" })
    } catch (err) {
      console.error("Delete account error:", err)
      setError("An error occurred while deleting your account")
      setDeleting(false)
    }
  }
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  )
}

