"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        redirect: false,
      })

      console.log("Sign in result:", result)

      if (result?.error) {
        console.error("Sign in error:", result.error)
        // Provide user-friendly error messages
        let errorMessage = "Failed to sign in. Please try again."
        if (result.error === "CredentialsSignin") {
          errorMessage = "Invalid email or authentication failed. Please check your email and try again."
        } else if (result.error.includes("blocked")) {
          errorMessage = "Your account has been blocked. Please contact support."
        } else if (result.error) {
          errorMessage = result.error
        }
        setError(errorMessage)
      } else if (result?.ok) {
        // Check if user has nickname, redirect to profile if not
        // We'll check this on the home page after session loads
        router.push("/")
        router.refresh()
      } else {
        setError("Failed to sign in. Please try again.")
      }
    } catch (err) {
      console.error("Sign in exception:", err)
      setError(`An error occurred: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC] px-4 py-12 relative">
      <div className="max-w-md w-full relative z-10">
        <div className="glass-enhanced rounded-3xl shadow-brand-xl border-2 border-[#5C7C5C]/15 p-10 sm:p-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-gradient-brand tracking-tighter mb-4 leading-tight">Studio 730</h1>
            <p className="text-[#6B8E6A] text-lg md:text-xl font-medium leading-relaxed">Sign in with your email</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-7">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-r-lg flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#5C7C5C] mb-2 tracking-wide uppercase">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-enhanced py-3"
                placeholder="your@email.com"
              />
              <p className="mt-2 text-sm text-[#6B8E6A]">
                No password required. We'll send you a magic link.
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="spinner -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-[#5C7C5C]/20">
            <p className="text-center text-sm text-[#6B8E6A]">
              Don't have an account?{" "}
              <a href="/signup" className="text-[#5C7C5C] hover:text-[#4A654A] font-semibold transition-colors">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

