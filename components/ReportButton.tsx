"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"

interface ReportButtonProps {
  type: "record" | "comment" | "user"
  targetId: string
  reportedUserId?: string
}

export default function ReportButton({ type, targetId, reportedUserId }: ReportButtonProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!session?.user?.id) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          reason,
          description: description.trim() || null,
          recordId: type === "record" ? targetId : null,
          commentId: type === "comment" ? targetId : null,
          reportedUserId: type === "user" ? (reportedUserId || targetId) : null,
        }),
      })

      if (response.ok) {
        setIsOpen(false)
        setReason("")
        setDescription("")
        alert("Report submitted. Thank you for helping keep our community safe.")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to submit report")
      }
    } catch (error) {
      console.error("Error submitting report:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-[#6B8E6A] hover:text-red-600 transition-colors"
        aria-label="Report"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 glass-enhanced rounded-xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-4 z-50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#5C7C5C] mb-2">
                Reason for reporting
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full px-3 py-2 border-2 border-[#5C7C5C]/20 rounded-lg text-sm"
              >
                <option value="">Select a reason</option>
                <option value="spam">Spam</option>
                <option value="inappropriate">Inappropriate Content</option>
                <option value="harassment">Harassment</option>
                <option value="other">Other</option>
              </select>
            </div>

            {reason && (
              <div>
                <label className="block text-sm font-semibold text-[#5C7C5C] mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-[#5C7C5C]/20 rounded-lg text-sm resize-none"
                  placeholder="Provide more context..."
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!reason || submitting}
                className="btn-primary text-sm flex-1 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setReason("")
                  setDescription("")
                }}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
