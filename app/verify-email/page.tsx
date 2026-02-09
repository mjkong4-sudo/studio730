"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC] px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-[#5C7C5C]/10 p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#5C7C5C] tracking-tight mb-2">Studio 730</h1>
            <p className="text-[#6B8E6A]">Check your email</p>
          </div>
          
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-[#5C7C5C]/10 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#5C7C5C] mb-3">
                We sent you a login link
              </h2>
              {email && (
                <p className="text-[#6B8E6A] mb-4 font-medium">
                  Check your inbox at <span className="text-[#5C7C5C]">{email}</span>
                </p>
              )}
              <p className="text-[#6B8E6A] leading-relaxed">
                Click the link in the email to sign in to your account. The link will expire in 24 hours.
              </p>
            </div>

            <div className="bg-[#5C7C5C]/10 border-l-4 border-[#5C7C5C] rounded-r-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-[#5C7C5C] mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-[#5C7C5C] mb-1">Didn't receive the email?</p>
                  <p className="text-sm text-[#6B8E6A]">Check your spam folder or try signing in again.</p>
                </div>
              </div>
            </div>

            <Link
              href="/login"
              className="block w-full text-center bg-[#5C7C5C] text-white py-3 px-4 rounded-lg hover:bg-[#4A654A] transition-colors font-semibold shadow-sm hover:shadow-md"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC]">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-[#5C7C5C]/20 rounded-full mx-auto"></div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

