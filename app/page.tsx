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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-64 mb-8"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-6"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 animate-fade-in">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight mb-3">
              Studio 730 Records
            </h1>
            <p className="text-gray-600 text-xl font-medium">Track your Thursday 7:30 gatherings</p>
          </div>
          <Link
            href="/create-record"
            className="group inline-flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 font-bold text-base"
          >
            <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Record
          </Link>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 animate-fade-in">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center">
                <svg className="h-10 w-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No records yet</h3>
              <p className="text-gray-500 mb-8 text-lg">Get started by creating your first Studio 730 record</p>
              <Link
                href="/create-record"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Create your first record
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {records.map((record, index) => (
              <article key={record.id} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 sm:p-8 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                        {(record.user.nickname || record.user.email || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {record.user.nickname || record.user.email}
                        </h2>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 ml-14">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{formatDate(record.date)}</span>
                      </div>
                      {record.gathering && (
                        <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-xs font-bold shadow-sm">
                          {record.gathering}
                        </span>
                      )}
                      {record.city && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-medium">{record.city}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {session.user.id === record.user.id && (
                      <Link
                        href={`/edit-record/${record.id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50"
                      >
                        Edit
                      </Link>
                    )}
                    <time className="text-xs text-gray-400 font-medium" dateTime={record.createdAt}>
                      {formatDateTime(record.createdAt)}
                    </time>
                  </div>
                </div>

                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">{record.content}</p>
                </div>

                <div className="border-t border-gray-200/60 pt-6 mt-6">
                  <div className="flex items-center gap-3 mb-5">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Comments
                    </h3>
                    {record.comments.length > 0 && (
                      <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-sm">
                        {record.comments.length}
                      </span>
                    )}
                  </div>
                  
                  {record.comments.length > 0 && (
                    <div className="space-y-3 mb-5">
                      {record.comments.map((comment) => (
                        <div key={comment.id} className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all duration-200">
                          {editingCommentId === comment.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                                autoFocus
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleSaveComment(comment.id)}
                                  disabled={submittingComment === comment.id}
                                  className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                  {submittingComment === comment.id ? "Saving..." : "Save"}
                                </button>
                                <button
                                  onClick={handleCancelEditComment}
                                  disabled={submittingComment === comment.id}
                                  className="text-sm px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                    {(comment.user.nickname || comment.user.email || "U")[0].toUpperCase()}
                                  </div>
                                  <span className="font-bold text-sm text-gray-900">
                                    {comment.user.nickname || comment.user.email}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {session.user.id === comment.user.id && (
                                    <button
                                      onClick={() => handleStartEditComment(comment.id, comment.content)}
                                      className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  <time className="text-xs text-gray-400 font-medium" dateTime={comment.createdAt}>
                                    {formatDateTime(comment.createdAt)}
                                  </time>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed ml-9">{comment.content}</p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
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
                      className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm bg-gray-50/50 hover:bg-white hover:border-gray-300"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAddComment(record.id)
                        }
                      }}
                    />
                    <button
                      onClick={() => handleAddComment(record.id)}
                      disabled={submittingComment === record.id || !commentTexts[record.id]?.trim()}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/50 shadow-lg hover:shadow-xl disabled:hover:shadow-lg"
                    >
                      {submittingComment === record.id ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        "Post"
                      )}
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
