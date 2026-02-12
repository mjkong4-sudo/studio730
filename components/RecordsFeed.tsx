"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { Session } from "next-auth"
import ReportButton from "./ReportButton"
import { getGroupByName } from "@/lib/groups"

export interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    email: string
    nickname: string | null
  }
}

export interface StudioRecord {
  id: string
  date: string
  city: string | null
  content: string
  gathering: string | null
  imageUrl: string | null
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
  reactions?: Array<{ id: string; type: string; userId: string }>
  userReaction?: { id: string; type: string; userId: string } | null
  reactionCounts?: { like: number; heart: number; "thumbs-up": number }
  _count?: { comments: number; reactions: number }
}

interface RecordsFeedProps {
  session: Session
  gatheringFilter: string
  showGatheringFilter?: boolean
  availableGatherings?: string[]
  title?: string
  subtitle?: string
  mine?: boolean
  emphasizeGroup?: boolean
}

export default function RecordsFeed({
  session,
  gatheringFilter,
  showGatheringFilter = false,
  availableGatherings = [],
  title = "Recent Records",
  subtitle = "See what members are sharing",
  mine = false,
  emphasizeGroup = false
}: RecordsFeedProps) {
  const [records, setRecords] = useState<StudioRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState("")
  const [selectedGathering, setSelectedGathering] = useState(gatheringFilter)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [reactingRecords, setReactingRecords] = useState<Set<string>>(new Set())

  const effectiveGathering = showGatheringFilter ? selectedGathering : gatheringFilter

  const fetchRecords = async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
        ...(effectiveGathering !== "all" && { gathering: effectiveGathering }),
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
        ...(mine && { mine: "true" })
      })
      const response = await fetch(`/api/records?${params}`)
      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const data = await response.json()

      if (data.records && Array.isArray(data.records)) {
        if (append) {
          setRecords(prev => [...(Array.isArray(prev) ? prev : []), ...data.records])
        } else {
          setRecords(data.records)
        }
        setHasMore(data.pagination?.hasMore ?? false)
        setTotalCount(data.pagination?.totalCount ?? data.records.length)
      } else if (Array.isArray(data)) {
        setRecords(data)
        setHasMore(false)
        setTotalCount(data.length)
      } else {
        setRecords([])
        setHasMore(false)
        setTotalCount(0)
      }
    } catch (error) {
      console.error("Error fetching records:", error)
      setRecords([])
      setHasMore(false)
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    setRecords([])
    fetchRecords(1, false)
  }, [effectiveGathering, searchQuery, mine])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchRecords(nextPage, true)
  }

  const handleReaction = async (recordId: string) => {
    if (!session?.user?.id) return
    const record = records.find(r => r.id === recordId)
    if (!record) return
    const hasReaction = !!record.userReaction
    const typeToToggle = hasReaction ? record.userReaction!.type : "like"
    setReactingRecords(prev => new Set(prev).add(recordId))
    try {
      if (hasReaction) {
        await fetch(`/api/reactions?recordId=${recordId}&type=${typeToToggle}`, { method: "DELETE" })
      } else {
        await fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recordId, type: "like" })
        })
      }
      fetchRecords(page, false)
    } catch (error) {
      console.error("Error toggling reaction:", error)
    } finally {
      setReactingRecords(prev => {
        const next = new Set(prev)
        next.delete(recordId)
        return next
      })
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
        body: JSON.stringify({ recordId, content })
      })
      if (response.ok) {
        setCommentTexts({ ...commentTexts, [recordId]: "" })
        fetchRecords(1, false)
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
        body: JSON.stringify({ content: editingCommentText })
      })
      if (response.ok) {
        setEditingCommentId(null)
        setEditingCommentText("")
        fetchRecords(1, false)
      } else {
        const data = await response.json()
        alert(data.error || "Failed to update comment")
      }
    } catch (error) {
      console.error("Error updating comment:", error)
    } finally {
      setSubmittingComment(null)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })

  const formatMonthYear = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", { month: "long", year: "numeric" })

  const isRecentRecord = (createdAt: string) => {
    const hoursDiff = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
    return hoursDiff < 24
  }

  const groupRecordsByMonth = (recs: StudioRecord[]) => {
    const groups: Record<string, StudioRecord[]> = {}
    recs.forEach(record => {
      const monthYear = formatMonthYear(record.date)
      if (!groups[monthYear]) groups[monthYear] = []
      groups[monthYear].push(record)
    })
    return groups
  }

  const clearFilters = () => {
    setSelectedGathering("all")
    setSearchQuery("")
  }

  if (loading && records.length === 0) {
    return (
      <div className="animate-pulse space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-enhanced rounded-2xl p-8">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-32 mb-6" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const groupedRecords = groupRecordsByMonth(records)
  const sortedMonths = Object.keys(groupedRecords).sort((a, b) => {
    const dateA = new Date(a + " 1").getTime()
    const dateB = new Date(b + " 1").getTime()
    return dateB - dateA
  })

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gradient-subtle mb-2 tracking-tight">{title}</h2>
        <p className="text-[#6B8E6A] text-lg">{subtitle}</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-enhanced rounded-2xl shadow-brand-md border-2 border-[#5C7C5C]/15 p-6 mb-8 relative z-10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search records</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <svg className="h-5 w-5 text-[#6B8E6A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by content, author, location, or gathering..."
                className="w-full py-3 pr-4 pl-[3.75rem] border-2 border-[#5C7C5C]/20 rounded-xl focus:ring-2 focus:ring-[#5C7C5C]/30 focus:border-[#5C7C5C] transition-all duration-200 text-[#5C7C5C] bg-white/80 hover:bg-white hover:border-[#5C7C5C]/40 placeholder-[#6B8E6A]/50 text-sm"
                style={{ paddingLeft: "3.75rem" }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  <svg className="h-5 w-5 text-[#6B8E6A] hover:text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {showGatheringFilter && (
            <div className="md:w-64">
              <label htmlFor="gathering-filter" className="sr-only">Filter by gathering</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <svg className="h-5 w-5 text-[#6B8E6A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <select
                  id="gathering-filter"
                  value={selectedGathering}
                  onChange={e => setSelectedGathering(e.target.value)}
                  className="w-full py-3 pr-10 pl-[3.75rem] border-2 border-[#5C7C5C]/20 rounded-xl focus:ring-2 focus:ring-[#5C7C5C]/30 focus:border-[#5C7C5C] transition-all duration-200 text-[#5C7C5C] bg-white/80 hover:bg-white hover:border-[#5C7C5C]/40 text-sm appearance-none cursor-pointer"
                  style={{ paddingLeft: "3.75rem" }}
                >
                  <option value="all">All Gatherings</option>
                  {availableGatherings.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-[#6B8E6A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        {(effectiveGathering !== "all" || searchQuery.trim() !== "" || totalCount > 0) && (
          <div className="mt-4 pt-4 border-t border-[#5C7C5C]/20">
            <p className="text-sm text-[#6B8E6A]">
              Showing <span className="font-semibold text-[#5C7C5C]">{records.length}</span> of <span className="font-semibold text-[#5C7C5C]">{totalCount}</span> records
              {effectiveGathering !== "all" && (
                <span className="ml-2">
                  • Filtered by: <span className="font-semibold text-[#5C7C5C]">{effectiveGathering}</span>
                </span>
              )}
              {searchQuery.trim() !== "" && (
                <span className="ml-2">
                  • Searching: <span className="font-semibold text-[#5C7C5C]">&quot;{searchQuery}&quot;</span>
                </span>
              )}
            </p>
            {(effectiveGathering !== "all" || searchQuery.trim() !== "") && (
              <button onClick={clearFilters} className="mt-2 text-sm text-[#5C7C5C] hover:text-[#4A654A] font-semibold transition-colors underline">
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {(!Array.isArray(records) || records.length === 0) ? (
        <div className="text-center py-24 md:py-32 glass-enhanced rounded-3xl shadow-brand-xl border-2 border-[#5C7C5C]/15 animate-fade-in relative z-10">
          <div className="max-w-lg mx-auto px-6">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-[#5C7C5C]/20 to-[#6B8E6A]/20 rounded-3xl flex items-center justify-center shadow-lg">
              <svg className="h-12 w-12 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gradient-brand mb-5 tracking-tight leading-tight">No records yet</h3>
            <p className="text-[#6B8E6A] mb-6 text-lg md:text-xl leading-relaxed max-w-md mx-auto">
              {effectiveGathering !== "all" ? "No records in this group yet." : "Get started by creating your first Studio 730 record."}
            </p>
            <Link
              href="/create-record"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-[#5C7C5C] to-[#6B8E6A] text-white px-8 py-4 rounded-xl hover:from-[#4A654A] hover:to-[#5C7C5C] font-semibold text-base shadow-brand-lg hover:shadow-brand-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Create your first record
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-12 md:space-y-16">
          {sortedMonths.map((monthYear, monthIndex) => (
            <div key={monthYear} className="space-y-8 md:space-y-10">
              <div className="flex items-center gap-4 mb-6 animate-fade-in" style={{ animationDelay: `${monthIndex * 100}ms` }}>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#5C7C5C]/20 to-[#5C7C5C]/20" />
                <h2 className="text-2xl md:text-3xl font-bold text-gradient-subtle px-4">{monthYear}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[#5C7C5C]/20 via-[#5C7C5C]/20 to-transparent" />
              </div>

              {groupedRecords[monthYear].map((record: StudioRecord, recordIndex: number) => {
                const isNew = isRecentRecord(record.createdAt)
                const isFirstInMonth = recordIndex === 0
                const recordGroup = record.gathering ? getGroupByName(record.gathering) : null
                return (
                  <article
                    key={record.id}
                    className={`glass-enhanced rounded-3xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-8 sm:p-10 card-lift animate-fade-in group relative z-10 ${
                      isFirstInMonth && isNew ? "ring-2 ring-[#5C7C5C]/30 ring-offset-4 ring-offset-[#FCFAE9]" : ""
                    }`}
                    style={{ animationDelay: `${monthIndex * 100 + recordIndex * 50}ms` }}
                  >
                    {isNew && (
                      <div className="absolute top-4 right-4 z-20">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-[#5C7C5C] to-[#6B8E6A] text-white text-xs font-bold rounded-full shadow-md animate-pulse">
                          <span className="w-2 h-2 bg-white rounded-full" /> New
                        </span>
                      </div>
                    )}
                    {isFirstInMonth && (
                      <div className="absolute -top-3 left-8 z-20">
                        <div className="px-4 py-1 bg-gradient-to-r from-[#5C7C5C] to-[#6B8E6A] text-white text-xs font-bold rounded-full shadow-md">
                          Latest
                        </div>
                      </div>
                    )}

                    {emphasizeGroup && record.gathering && (
                      <div className="mb-6 flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#6B8E6A] uppercase tracking-wide">Group:</span>
                        {recordGroup ? (
                          <Link
                            href={`/groups/${recordGroup.id}`}
                            className="badge-primary text-base px-4 py-2 hover:opacity-90 transition-opacity"
                          >
                            {record.gathering}
                          </Link>
                        ) : (
                          <span className="badge-primary text-base px-4 py-2">{record.gathering}</span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-5 mb-5">
                          <div className="relative">
                            <div className="avatar-gradient w-12 h-12 rounded-2xl flex items-center justify-center text-base">
                              {(record.user.nickname || record.user.email || "U")[0].toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#6B8E6A] rounded-full border-2 border-white shadow-sm" />
                          </div>
                          <div>
                            <Link href={`/users/${record.user.id}`} className="hover:opacity-80 transition-opacity">
                              <h2 className="text-xl md:text-2xl font-bold text-gradient-subtle tracking-tight">
                                {record.user.nickname || record.user.email}
                              </h2>
                            </Link>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-[#5C7C5C] ml-17">
                          <div className="badge-secondary transition-all duration-200 hover:scale-105">
                            <svg className="w-4 h-4 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-semibold">{formatDate(record.date)}</span>
                          </div>
                          {record.gathering && (
                            <span className="badge-primary transition-all duration-200 hover:scale-105">{record.gathering}</span>
                          )}
                          {record.city && (
                            <div className="badge-secondary transition-all duration-200 hover:scale-105">
                              <svg className="w-4 h-4 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="font-semibold">{record.city}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {session.user?.id === record.user.id && (
                          <Link
                            href={`/edit-record/${record.id}`}
                            className="text-sm text-[#5C7C5C] hover:text-[#4A654A] font-semibold transition-colors px-3 py-1.5 rounded-lg hover:bg-[#5C7C5C]/10"
                          >
                            Edit
                          </Link>
                        )}
                        {session.user?.id !== record.user.id && (
                          <ReportButton type="record" targetId={record.id} reportedUserId={record.user.id} />
                        )}
                        <time className="text-xs text-[#6B8E6A] font-medium" dateTime={record.createdAt}>
                          {formatDateTime(record.createdAt)}
                        </time>
                      </div>
                    </div>

                    {record.imageUrl && (
                      <div className="mb-6 rounded-xl overflow-hidden border-2 border-[#5C7C5C]/20">
                        <img src={record.imageUrl} alt="Record" className="w-full h-auto max-h-96 object-cover" loading="lazy" />
                      </div>
                    )}

                    <div className="prose max-w-none mb-6">
                      <p className="text-[#2D3E2D] whitespace-pre-wrap leading-relaxed text-base md:text-lg font-medium">{record.content}</p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-[#6B8E6A]">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{Math.ceil(record.content.split(" ").length / 200)} min read</span>
                      </div>
                    </div>

                    {/* Reactions */}
                    <div className="flex items-center gap-4 pt-4 border-t border-[#5C7C5C]/20 mb-6">
                      <button
                        onClick={() => handleReaction(record.id)}
                        disabled={reactingRecords.has(record.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                          record.userReaction
                            ? "bg-[#5C7C5C]/20 text-[#5C7C5C]"
                            : "hover:bg-[#5C7C5C]/10 text-[#6B8E6A]"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <svg className="w-5 h-5" fill={record.userReaction ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="font-semibold">
                          {(record.reactionCounts?.like || 0) + (record.reactionCounts?.heart || 0) + (record.reactionCounts?.["thumbs-up"] || 0)}
                        </span>
                      </button>
                      <div className="ml-auto text-sm text-[#6B8E6A]">
                        {record._count?.comments ?? record.comments.length} comments
                      </div>
                    </div>

                    {/* Comments */}
                    <div className="border-t-2 border-[#5C7C5C]/20 pt-8 mt-8">
                      <h3 className="font-bold text-gradient-subtle text-lg md:text-xl tracking-tight flex items-center gap-2 mb-6">
                        <svg className="w-5 h-5 text-[#5C7C5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Comments
                      </h3>

                      {record.comments.length > 0 && (
                        <div className="space-y-4 mb-6">
                          {record.comments.map((comment: Comment) => (
                            <div key={comment.id} className="bg-[#F5F5EC]/70 rounded-xl p-5 border-2 border-[#5C7C5C]/15">
                              {editingCommentId === comment.id ? (
                                <div className="space-y-3">
                                  <textarea
                                    value={editingCommentText}
                                    onChange={e => setEditingCommentText(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 border-2 border-[#5C7C5C]/30 rounded-xl focus:ring-2 focus:ring-[#5C7C5C] text-sm bg-white"
                                    autoFocus
                                  />
                                  <div className="flex gap-3">
                                    <button
                                      onClick={() => handleSaveComment(comment.id)}
                                      disabled={submittingComment === comment.id}
                                      className="text-sm bg-[#5C7C5C] text-white px-5 py-2.5 rounded-xl hover:bg-[#4A654A] disabled:opacity-50 font-semibold"
                                    >
                                      {submittingComment === comment.id ? "Saving..." : "Save"}
                                    </button>
                                    <button onClick={handleCancelEditComment} className="text-sm px-5 py-2.5 border-2 border-[#5C7C5C]/30 rounded-xl text-[#5C7C5C] hover:bg-[#5C7C5C]/10 font-semibold">
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className="avatar-gradient w-8 h-8 rounded-xl flex items-center justify-center text-xs">
                                        {(comment.user.nickname || comment.user.email || "U")[0].toUpperCase()}
                                      </div>
                                      <span className="font-bold text-sm text-[#5C7C5C]">{comment.user.nickname || comment.user.email}</span>
                                      {session.user?.id !== comment.user.id && (
                                        <ReportButton type="comment" targetId={comment.id} reportedUserId={comment.user.id} />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {session.user?.id === comment.user.id && (
                                        <button
                                          onClick={() => handleStartEditComment(comment.id, comment.content)}
                                          className="text-xs text-[#5C7C5C] hover:text-[#4A654A] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#5C7C5C]/10"
                                        >
                                          Edit
                                        </button>
                                      )}
                                      <time className="text-xs text-[#6B8E6A]" dateTime={comment.createdAt}>
                                        {formatDateTime(comment.createdAt)}
                                      </time>
                                    </div>
                                  </div>
                                  <p className="text-sm text-[#2D3E2D] leading-relaxed ml-11 font-medium">{comment.content}</p>
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
                          onChange={e => setCommentTexts({ ...commentTexts, [record.id]: e.target.value })}
                          placeholder="Add a comment..."
                          className="input-enhanced flex-1 py-3.5 text-sm font-medium"
                          onKeyPress={e => e.key === "Enter" && handleAddComment(record.id)}
                        />
                        <button
                          onClick={() => handleAddComment(record.id)}
                          disabled={submittingComment === record.id || !commentTexts[record.id]?.trim()}
                          className="btn-primary px-7 py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingComment === record.id ? "Posting..." : "Post"}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ))}

          {hasMore && records.length > 0 && (
            <div className="flex justify-center pt-8">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="btn-secondary px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
