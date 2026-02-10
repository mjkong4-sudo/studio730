"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"

interface Stats {
  totalUsers: number
  totalRecords: number
  totalComments: number
  totalReactions: number
  activeUsersLast30Days: number
  newUsersLast30Days: number
  pendingReports: number
  blockedUsers: number
  recordsLast7Days: number
}

interface User {
  id: string
  email: string
  nickname: string | null
  firstName: string | null
  lastName: string | null
  role: string
  blocked: boolean
  createdAt: string
  _count: {
    records: number
    comments: number
    reactions: number
  }
}

interface Report {
  id: string
  type: string
  reason: string
  description: string | null
  status: string
  createdAt: string
  reportedBy: {
    id: string
    email: string
    nickname: string | null
  }
  record?: {
    id: string
    content: string
    user: {
      id: string
      email: string
      nickname: string | null
    }
  } | null
  comment?: {
    id: string
    content: string
    user: {
      id: string
      email: string
      nickname: string | null
    }
  } | null
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "reports">("overview")
  const [userPage, setUserPage] = useState(1)
  const [reportPage, setReportPage] = useState(1)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      checkAdminAccess()
    }
  }, [status, router])

  const checkAdminAccess = async () => {
    try {
      // Check if user is admin by trying to fetch stats
      const response = await fetch("/api/admin/stats")
      if (!response.ok) {
        if (response.status === 403) {
          router.push("/")
          return
        }
        throw new Error("Failed to check admin access")
      }
      fetchData()
    } catch (error) {
      console.error("Error checking admin access:", error)
      router.push("/")
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsRes, usersRes, reportsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users?page=1&limit=10"),
        fetch("/api/admin/reports?status=pending&page=1&limit=10"),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users)
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json()
        setReports(reportsData.reports)
      }
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: string, value: any) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, [action]: value }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const handleReportAction = async (reportId: string, status: string, action?: string) => {
    try {
      const response = await fetch("/api/admin/reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status, action }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error updating report:", error)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] to-[#FCFAE9]">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5EC] to-[#FCFAE9]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-brand mb-2">Admin Dashboard</h1>
          <p className="text-[#6B8E6A] text-lg">Manage your community</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-[#5C7C5C]/20">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "overview"
                ? "text-[#5C7C5C] border-b-2 border-[#5C7C5C]"
                : "text-[#6B8E6A] hover:text-[#5C7C5C]"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "users"
                ? "text-[#5C7C5C] border-b-2 border-[#5C7C5C]"
                : "text-[#6B8E6A] hover:text-[#5C7C5C]"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "reports"
                ? "text-[#5C7C5C] border-b-2 border-[#5C7C5C]"
                : "text-[#6B8E6A] hover:text-[#5C7C5C]"
            }`}
          >
            Reports ({stats?.pendingReports || 0})
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-enhanced rounded-2xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-6">
                <div className="text-3xl font-bold text-gradient-brand mb-2">{stats.totalUsers}</div>
                <div className="text-sm text-[#6B8E6A]">Total Users</div>
              </div>
              <div className="glass-enhanced rounded-2xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-6">
                <div className="text-3xl font-bold text-gradient-brand mb-2">{stats.totalRecords}</div>
                <div className="text-sm text-[#6B8E6A]">Total Records</div>
              </div>
              <div className="glass-enhanced rounded-2xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-6">
                <div className="text-3xl font-bold text-gradient-brand mb-2">{stats.totalComments}</div>
                <div className="text-sm text-[#6B8E6A]">Total Comments</div>
              </div>
              <div className="glass-enhanced rounded-2xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-6">
                <div className="text-3xl font-bold text-gradient-brand mb-2">{stats.pendingReports}</div>
                <div className="text-sm text-[#6B8E6A]">Pending Reports</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-enhanced rounded-2xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-6">
                <div className="text-2xl font-bold text-gradient-brand mb-2">{stats.newUsersLast30Days}</div>
                <div className="text-sm text-[#6B8E6A]">New Users (30 days)</div>
              </div>
              <div className="glass-enhanced rounded-2xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-6">
                <div className="text-2xl font-bold text-gradient-brand mb-2">{stats.blockedUsers}</div>
                <div className="text-sm text-[#6B8E6A]">Blocked Users</div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="glass-enhanced rounded-2xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-6">
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-[#5C7C5C]/20"
                >
                  <div>
                    <div className="font-semibold text-[#5C7C5C]">
                      {user.nickname || user.email}
                    </div>
                    <div className="text-sm text-[#6B8E6A]">
                      {user._count.records} records • {user._count.comments} comments
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleUserAction(user.id, "role", e.target.value)}
                      className="text-sm border border-[#5C7C5C]/30 rounded-lg px-3 py-1"
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => handleUserAction(user.id, "blocked", !user.blocked)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                        user.blocked
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-red-500 text-white hover:bg-red-600"
                      }`}
                    >
                      {user.blocked ? "Unblock" : "Block"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="glass-enhanced rounded-2xl shadow-brand-lg border-2 border-[#5C7C5C]/15 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge-primary">{report.type}</span>
                      <span className="badge-secondary">{report.reason}</span>
                    </div>
                    <div className="text-sm text-[#6B8E6A]">
                      Reported by {report.reportedBy.nickname || report.reportedBy.email}
                    </div>
                    {report.description && (
                      <div className="mt-2 text-sm text-[#5C7C5C]">{report.description}</div>
                    )}
                  </div>
                  <div className="text-xs text-[#6B8E6A]">
                    {new Date(report.createdAt).toLocaleString()}
                  </div>
                </div>

                {report.record && (
                  <div className="p-4 bg-white/50 rounded-lg mb-4">
                    <div className="text-sm font-semibold text-[#5C7C5C] mb-1">
                      Record by {report.record.user.nickname || report.record.user.email}
                    </div>
                    <div className="text-sm text-[#6B8E6A] line-clamp-2">
                      {report.record.content}
                    </div>
                  </div>
                )}

                {report.comment && (
                  <div className="p-4 bg-white/50 rounded-lg mb-4">
                    <div className="text-sm font-semibold text-[#5C7C5C] mb-1">
                      Comment by {report.comment.user.nickname || report.comment.user.email}
                    </div>
                    <div className="text-sm text-[#6B8E6A]">{report.comment.content}</div>
                  </div>
                )}

                <div className="flex gap-3">
                  {report.type === "record" && report.record && (
                    <button
                      onClick={() => handleReportAction(report.id, "resolved", "delete_record")}
                      className="btn-secondary text-sm"
                    >
                      Delete Record
                    </button>
                  )}
                  {report.type === "comment" && report.comment && (
                    <button
                      onClick={() => handleReportAction(report.id, "resolved", "delete_comment")}
                      className="btn-secondary text-sm"
                    >
                      Delete Comment
                    </button>
                  )}
                  <button
                    onClick={() => handleReportAction(report.id, "dismissed")}
                    className="btn-secondary text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
