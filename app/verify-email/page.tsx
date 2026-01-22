"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Studio 730</h1>
        <p className="text-center text-gray-600 mb-8">Check your email</p>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              We sent you a login link
            </h2>
            {email && (
              <p className="text-gray-600 mb-4">
                Check your inbox at <strong>{email}</strong>
              </p>
            )}
            <p className="text-gray-600">
              Click the link in the email to sign in to your account. The link will expire in 24 hours.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Didn't receive the email?</strong> Check your spam folder or try again.
            </p>
          </div>

          <Link
            href="/login"
            className="block w-full text-center text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

