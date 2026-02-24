"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

function DonationForm({
  onSuccess,
  onError,
}: {
  onSuccess: () => void
  onError: (msg: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/donate?success=true`,
        },
      })
      if (error) {
        onError(error.message || "Payment failed")
      } else {
        onSuccess()
      }
    } catch (err) {
      onError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Processing..." : "Donate"}
      </button>
    </form>
  )
}

export default function DonatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [recipientType, setRecipientType] = useState<"platform" | "group" | "creator">("platform")
  const [recipientId, setRecipientId] = useState("")
  const [amount, setAmount] = useState("10")
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([])
  const [users, setUsers] = useState<Array<{ id: string; nickname: string | null; email: string }>>([])
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
    if (params.get("success") === "true") setSuccess(true)
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated") {
      fetch("/api/groups")
        .then(res => res.ok ? res.json() : { groups: [] })
        .then(data => setGroups(data.groups || []))
        .catch(() => {})
    }
  }, [status, router])

  const handleCreatePayment = async () => {
    setError("")
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt < 1) {
      setError("Please enter a valid amount (minimum $1)")
      return
    }
    if (recipientType !== "platform" && !recipientId) {
      setError("Please select a recipient")
      return
    }

    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          currency: "USD",
          recipientType,
          recipientId: recipientType === "platform" ? undefined : recipientId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create donation")
      setClientSecret(data.clientSecret)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create donation")
    }
  }

  const isStripeConfigured = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && stripePromise

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="animate-pulse h-12 bg-gray-200 rounded w-48 mx-auto" />
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] via-[#FCFAE9] to-[#F5F5EC]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-gradient-brand tracking-tighter mb-4">
            Support Studio 730
          </h1>
          <p className="text-[#6B8E6A] text-xl">
            Your donation helps keep our community strong
          </p>
        </div>

        {!isStripeConfigured ? (
          <div className="glass-enhanced rounded-3xl border-2 border-[#5C7C5C]/15 p-6">
            <p className="text-[#6B8E6A]">
              Donations are not configured yet. Please add Stripe keys to enable donations.
            </p>
          </div>
        ) : success ? (
          <div className="glass-enhanced rounded-3xl border-2 border-[#5C7C5C]/15 p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#5C7C5C]/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gradient-subtle mb-2">Thank you!</h2>
            <p className="text-[#6B8E6A] mb-6">Your donation has been received.</p>
            <Link href="/" className="btn-primary">
              Back to Home
            </Link>
          </div>
        ) : clientSecret ? (
          <div className="glass-enhanced rounded-3xl border-2 border-[#5C7C5C]/15 p-6">
            <Elements stripe={stripePromise!} options={{ clientSecret: clientSecret!, appearance: { theme: "stripe" } }}>
              <DonationForm
                onSuccess={() => setSuccess(true)}
                onError={setError}
              />
            </Elements>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="glass-enhanced rounded-3xl border-2 border-[#5C7C5C]/15 p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#5C7C5C] mb-2">Donate to</label>
              <select
                value={recipientType}
                onChange={e => {
                  setRecipientType(e.target.value as "platform" | "group" | "creator")
                  setRecipientId("")
                }}
                className="input-enhanced w-full"
              >
                <option value="platform">Studio 730 Platform</option>
                <option value="group">A Group</option>
                <option value="creator">A Creator</option>
              </select>
            </div>

            {recipientType === "group" && (
              <div>
                <label className="block text-sm font-semibold text-[#5C7C5C] mb-2">Select group</label>
                <select
                  value={recipientId}
                  onChange={e => setRecipientId(e.target.value)}
                  className="input-enhanced w-full"
                >
                  <option value="">Choose a group</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            {recipientType === "creator" && (
              <div>
                <label className="block text-sm font-semibold text-[#5C7C5C] mb-2">Creator (coming soon)</label>
                <p className="text-[#6B8E6A] text-sm">Creator donations will be available in a future update.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-[#5C7C5C] mb-2">Amount (USD)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="input-enhanced w-full"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleCreatePayment}
              disabled={recipientType === "creator" || (recipientType !== "platform" && !recipientId)}
              className="btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Payment
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
