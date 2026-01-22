"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    email: string
    nickname: string | null
  }
}

interface StudioRecord {
  id: string
  date: string
  city: string | null
  content: string
  gathering: string | null
  createdAt: string
  user: {
    id: string
    email: string
    nickname: string | null
    firstName: string | null
    lastName: string | null
    city: string | null
    country: string | null
  }
  comments: Comment[]
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [records, setRecords] = useState<StudioRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState<string>("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated" && session) {
      // Redirect to profile if user doesn't have a nickname set
      if (!session.user.hasNickname) {
        router.push("/profile?setup=true")
        return
      }
      fetchRecords()
    }
  }, [status, session, router])

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/records")
      const data = await response.json()
      setRecords(data)
    } catch (error) {
      console.error("Error fetching records:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (recordId: string) => {
    const content = commentTexts[recordId]?.trim()
    if (!content) return

    setSubmittingComment(recordId)
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId, content }),
      })

      if (response.ok) {
        setCommentTexts({ ...commentTexts, [recordId]: "" })
        fetchRecords()
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setSubmittingComment(null)
    }
  }

  const handleStartEditComment = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId)
    setEditingCommentText(currentContent)
  }

  const handleCancelEditComment = () => {
    setEditingCommentId(null)
    setEditingCommentText("")
  }

  const handleSaveComment = async (commentId: string) => {
    if (!editingCommentText.trim()) return

    setSubmittingComment(commentId)
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingCommentText }),
      })

      if (response.ok) {
        setEditingCommentId(null)
        setEditingCommentText("")
        fetchRecords()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to update comment")
      }
    } catch (error) {
      console.error("Error updating comment:", error)
      alert("An error occurred while updating the comment")
    } finally {
      setSubmittingComment(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (status === "loading" || loading) {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Studio 730 Records</h1>
            <p className="text-gray-600 mt-2">Track your Thursday 7:30 gatherings</p>
          </div>
          <Link
            href="/create-record"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Add Record
          </Link>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">No records yet</p>
            <Link
              href="/create-record"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Create your first record →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {records.map((record) => (
              <div key={record.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {record.user.nickname || record.user.email}
                      </h2>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>📅 {formatDate(record.date)}</span>
                      {record.gathering && (
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                          {record.gathering}
                        </span>
                      )}
                      {record.city && <span>📍 {record.city}</span>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {session.user.id === record.user.id && (
                      <Link
                        href={`/edit-record/${record.id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Edit
                      </Link>
                    )}
                    <span className="text-xs text-gray-400">
                      {formatDateTime(record.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="prose max-w-none mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{record.content}</p>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Comments ({record.comments.length})
                  </h3>
                  
                  {record.comments.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {record.comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                          {editingCommentId === comment.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                autoFocus
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleSaveComment(comment.id)}
                                  disabled={submittingComment === comment.id}
                                  className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                  {submittingComment === comment.id ? "Saving..." : "Save"}
                                </button>
                                <button
                                  onClick={handleCancelEditComment}
                                  disabled={submittingComment === comment.id}
                                  className="text-sm px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-sm text-gray-900">
                                  {comment.user.nickname || comment.user.email}
                                </span>
                                <div className="flex items-center space-x-2">
                                  {session.user.id === comment.user.id && (
                                    <button
                                      onClick={() => handleStartEditComment(comment.id, comment.content)}
                                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  <span className="text-xs text-gray-400">
                                    {formatDateTime(comment.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700">{comment.content}</p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={commentTexts[record.id] || ""}
                      onChange={(e) =>
                        setCommentTexts({
                          ...commentTexts,
                          [record.id]: e.target.value,
                        })
                      }
                      placeholder="Add a comment..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAddComment(record.id)
                        }
                      }}
                    />
                    <button
                      onClick={() => handleAddComment(record.id)}
                      disabled={submittingComment === record.id}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {submittingComment === record.id ? "..." : "Post"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
