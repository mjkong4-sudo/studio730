"use client"

import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Navbar from "@/components/Navbar"

interface User {
  id: string
  email: string
  nickname: string | null
  firstName: string | null
  lastName: string | null
  city: string | null
  country: string | null
  bio: string | null
  createdAt: string
  stats: {
    recordsCount: number
    commentsCount: number
    reactionsCount: number
  }
}

interface StudioRecord {
  id: string
  date: string
  content: string
  gathering: string | null
  city: string | null
  createdAt: string
  user: {
    id: string
    email: string
    nickname: string | null
    firstName: string | null
    lastName: string | null
  }
  comments: Array<{
    id: string
    content: string
    createdAt: string
    user: {
      id: string
      email: string
      nickname: string | null
    }
  }>
  _count: {
    comments: number
    reactions: number
  }
}

export default function UserProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [records, setRecords] = useState<StudioRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated" && userId) {
      fetchUserProfile()
    }
  }, [status, userId, router])

  const fetchUserProfile = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${userId}?page=${pageNum}&limit=10`)
      const data = await response.json()

      if (data.user) {
        setUser({
          ...data.user,
          stats: data.user.stats
        })
        if (pageNum === 1) {
          setRecords(data.records || [])
        } else {
          setRecords(prev => [...prev, ...(data.records || [])])
        }
        setHasMore(data.pagination.hasMore)
        setTotalCount(data.pagination.totalCount)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchUserProfile(nextPage)
  }

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user.nickname) {
      return user.nickname.substring(0, 2).toUpperCase()
    }
    return user.email.substring(0, 2).toUpperCase()
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] to-[#FCFAE9]">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="glass-enhanced rounded-3xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-8 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] to-[#FCFAE9]">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="glass-enhanced rounded-3xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-12 text-center">
              <h1 className="text-3xl font-bold text-gradient-brand mb-4">User not found</h1>
              <Link href="/" className="btn-primary">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] to-[#FCFAE9]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Header */}
          <div className="glass-enhanced rounded-3xl shadow-brand-xl border-2 border-[#5C7C5C]/15 p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
              {/* Avatar */}
              <div className="avatar-gradient w-24 h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-bold text-white shadow-lg">
                {getInitials(user)}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gradient-brand mb-2">
                  {user.nickname || user.firstName || user.email}
                </h1>
                {(user.firstName || user.lastName) && (
                  <p className="text-[#6B8E6A] text-lg mb-2">
                    {user.firstName} {user.lastName}
                  </p>
                )}
                {(user.city || user.country) && (
                  <p className="text-[#5C7C5C] text-sm mb-4">
                    {[user.city, user.country].filter(Boolean).join(", ")}
                  </p>
                )}
                {user.bio && (
                  <p className="text-[#6B8E6A] mb-4 leading-relaxed">{user.bio}</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-[#5C7C5C]/20">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gradient-brand">
                  {user.stats.recordsCount}
                </div>
                <div className="text-sm text-[#6B8E6A] mt-1">Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gradient-brand">
                  {user.stats.commentsCount}
                </div>
                <div className="text-sm text-[#6B8E6A] mt-1">Comments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gradient-brand">
                  {user.stats.reactionsCount}
                </div>
                <div className="text-sm text-[#6B8E6A] mt-1">Reactions</div>
              </div>
            </div>
          </div>

          {/* Records */}
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gradient-subtle">
              Records ({totalCount})
            </h2>

            {records.length === 0 ? (
              <div className="glass-enhanced rounded-3xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-12 text-center">
                <p className="text-[#6B8E6A] text-lg">No records yet</p>
              </div>
            ) : (
              <>
                {records.map((record) => (
                  <article
                    key={record.id}
                    className="glass-enhanced rounded-3xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-6 md:p-8 card-lift"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="avatar-gradient w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white">
                        {getInitials(record.user as any)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-[#5C7C5C]">
                            {record.user.nickname || record.user.firstName || record.user.email}
                          </span>
                          <span className="text-sm text-[#6B8E6A]">
                            {new Date(record.date).toLocaleDateString()}
                          </span>
                        </div>
                        {record.gathering && (
                          <div className="badge-primary mb-2">
                            {record.gathering}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-[#5C7C5C] mb-4 whitespace-pre-wrap leading-relaxed">
                      {record.content}
                    </p>

                    <div className="flex items-center gap-4 pt-4 border-t border-[#5C7C5C]/20">
                      <span className="text-sm text-[#6B8E6A]">
                        {record._count.comments} {record._count.comments === 1 ? "comment" : "comments"}
                      </span>
                      <span className="text-sm text-[#6B8E6A]">
                        {record._count.reactions} {record._count.reactions === 1 ? "reaction" : "reactions"}
                      </span>
                      <Link
                        href={`/records/${record.id}`}
                        className="text-sm text-[#5C7C5C] hover:text-[#4A654A] font-semibold ml-auto"
                      >
                        View →
                      </Link>
                    </div>
                  </article>
                ))}

                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleLoadMore}
                      className="btn-secondary px-8 py-4"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
