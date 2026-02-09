"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Sign up is the same as sign in - user will be created automatically
      const result = await signIn("credentials", {
        email,
        redirect: false,
      })

      if (result?.error) {
        setError("Failed to create account. Please try again.")
      } else {
        // New users will be redirected to profile setup from home page
        router.push("/")
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC] px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-[#5C7C5C]/10 p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#5C7C5C] tracking-tight mb-2">Studio 730</h1>
            <p className="text-[#6B8E6A]">Create your account</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-r-lg flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#5C7C5C] mb-2">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-[#5C7C5C]/30 rounded-lg focus:ring-2 focus:ring-[#5C7C5C] focus:border-[#5C7C5C] transition-colors text-[#5C7C5C] placeholder-[#6B8E6A]/50"
                placeholder="your@email.com"
              />
              <p className="mt-2 text-sm text-[#6B8E6A]">
                No password required. We'll send you a magic link.
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5C7C5C] text-white py-3 px-4 rounded-lg hover:bg-[#4A654A] focus:outline-none focus:ring-2 focus:ring-[#5C7C5C] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-[#5C7C5C]/20">
            <p className="text-center text-sm text-[#6B8E6A]">
              Already have an account?{" "}
              <a href="/login" className="text-[#5C7C5C] hover:text-[#4A654A] font-semibold transition-colors">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
