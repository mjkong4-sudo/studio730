"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { Session } from "next-auth"

interface RecordItem {
  id: string
  date: string
  content: string
  city: string | null
  gathering: string | null
  group?: { id: string; name: string } | null
  project?: { id: string; name: string } | null
  user: { id: string; nickname: string | null; email: string }
}

export default function TimelineView({
  session,
  gatheringFilter,
  groupIdFilter,
  projectIdFilter,
}: {
  session: Session
  gatheringFilter?: string
  groupIdFilter?: string
  projectIdFilter?: string
}) {
  const [records, setRecords] = useState<RecordItem[]>([])
  const [loading, setLoading] = useState(true)
  const [monthRange, setMonthRange] = useState(() => {
    const d = new Date()
    const from = new Date(d.getFullYear(), d.getMonth() - 2, 1)
    const to = new Date(d.getFullYear(), d.getMonth() + 3, 0)
    return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] }
  })

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      from: monthRange.from,
      to: monthRange.to,
      limit: "100",
      ...(groupIdFilter && { groupId: groupIdFilter }),
      ...(projectIdFilter && { projectId: projectIdFilter }),
      ...(gatheringFilter && gatheringFilter !== "all" && { gathering: gatheringFilter }),
    })
    fetch(`/api/records?${params}`)
      .then(res => res.ok ? res.json() : { records: [] })
      .then(data => setRecords(data.records || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [monthRange, groupIdFilter, projectIdFilter, gatheringFilter])

  const groupedByMonth: Record<string, RecordItem[]> = {}
  records.forEach((r: RecordItem) => {
    const key = new Date(r.date).toLocaleString("default", { month: "long", year: "numeric" })
    if (!groupedByMonth[key]) groupedByMonth[key] = []
    groupedByMonth[key].push(r)
  })
  const months = Object.keys(groupedByMonth).sort((a, b) => {
    const da = new Date(a + " 1")
    const db = new Date(b + " 1")
    return db.getTime() - da.getTime()
  })

  const loadMore = () => {
    const fromDate = new Date(monthRange.from)
    fromDate.setMonth(fromDate.getMonth() - 3)
    setMonthRange(prev => ({
      from: fromDate.toISOString().split("T")[0],
      to: prev.to,
    }))
  }

  return (
    <div className="space-y-8">
      {loading && records.length === 0 ? (
        <div className="animate-pulse space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#5C7C5C]/30 via-[#6B8E6A]/30 to-transparent" />
          <div className="space-y-12 pl-12">
            {months.map(month => (
              <div key={month} className="relative">
                <div className="absolute -left-8 top-2 w-4 h-4 rounded-full bg-[#5C7C5C] border-4 border-[#FCFAE9]" />
                <h3 className="text-xl font-bold text-gradient-subtle mb-6">{month}</h3>
                <div className="space-y-4">
                  {groupedByMonth[month]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(record => (
                      <Link
                        key={record.id}
                        href={`/edit-record/${record.id}`}
                        className="block glass-enhanced rounded-xl border-2 border-[#5C7C5C]/15 p-6 hover:border-[#5C7C5C]/40 transition-all card-lift"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-[#2D3E2D] font-medium line-clamp-2">{record.content}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className="text-sm text-[#6B8E6A] font-semibold">
                                {new Date(record.date).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                              {(record.group?.name || record.gathering) && (
                                <span className="badge-primary text-xs">
                                  {record.group?.name || record.gathering}
                                </span>
                              )}
                              {record.project && (
                                <span className="badge-secondary text-xs">{record.project.name}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-[#6B8E6A] flex-shrink-0">
                            {record.user.nickname || record.user.email}
                          </span>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {records.length > 0 && (
        <div className="flex justify-center pt-8">
          <button onClick={loadMore} className="btn-secondary">
            Load earlier months
          </button>
        </div>
      )}
    </div>
  )
}
