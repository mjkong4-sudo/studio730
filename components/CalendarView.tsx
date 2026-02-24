"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { Session } from "next-auth"

interface RecordItem {
  id: string
  date: string
  content: string
  gathering: string | null
  group?: { id: string; name: string } | null
  user: { id: string; nickname: string | null; email: string }
}

export default function CalendarView({
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
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [recordsByDate, setRecordsByDate] = useState<Record<string, RecordItem[]>>({})
  const [loading, setLoading] = useState(true)

  const firstDay = new Date(currentMonth.year, currentMonth.month, 1)
  const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0)
  const from = firstDay.toISOString().split("T")[0]
  const to = lastDay.toISOString().split("T")[0]

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      from,
      to,
      limit: "500",
      ...(groupIdFilter && { groupId: groupIdFilter }),
      ...(projectIdFilter && { projectId: projectIdFilter }),
      ...(gatheringFilter && gatheringFilter !== "all" && { gathering: gatheringFilter }),
    })
    fetch(`/api/records?${params}`)
      .then(res => res.ok ? res.json() : { records: [] })
      .then(data => {
        const byDate: Record<string, RecordItem[]> = {}
        ;(data.records || []).forEach((r: RecordItem) => {
          const d = new Date(r.date).toISOString().split("T")[0]
          if (!byDate[d]) byDate[d] = []
          byDate[d].push(r)
        })
        setRecordsByDate(byDate)
      })
      .catch(() => setRecordsByDate({}))
      .finally(() => setLoading(false))
  }, [from, to, groupIdFilter, projectIdFilter, gatheringFilter])

  const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate()
  const startOffset = new Date(currentMonth.year, currentMonth.month, 1).getDay()
  const monthName = firstDay.toLocaleString("default", { month: "long", year: "numeric" })

  const prevMonth = () => {
    setCurrentMonth(prev =>
      prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }
    )
  }
  const nextMonth = () => {
    setCurrentMonth(prev =>
      prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }
    )
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gradient-subtle">{monthName}</h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl bg-[#5C7C5C]/10 text-[#5C7C5C] hover:bg-[#5C7C5C]/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl bg-[#5C7C5C]/10 text-[#5C7C5C] hover:bg-[#5C7C5C]/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-2 animate-pulse">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="glass-enhanced rounded-2xl border-2 border-[#5C7C5C]/15 p-6">
          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-[#6B8E6A] py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const records = recordsByDate[dateStr] || []
              const hasRecords = records.length > 0
              return (
                <div
                  key={day}
                  className={`aspect-square rounded-xl p-1 border-2 transition-colors ${
                    hasRecords
                      ? "border-[#5C7C5C]/40 bg-[#5C7C5C]/5"
                      : "border-transparent hover:border-[#5C7C5C]/20"
                  }`}
                >
                  <div className="text-sm font-medium text-[#5C7C5C] mb-1">{day}</div>
                  {hasRecords && (
                    <div className="space-y-0.5 overflow-hidden">
                      {records.slice(0, 2).map(r => (
                        <Link
                          key={r.id}
                          href={`/edit-record/${r.id}`}
                          className="block text-xs text-[#6B8E6A] truncate hover:text-[#5C7C5C]"
                        >
                          {r.content.slice(0, 15)}...
                        </Link>
                      ))}
                      {records.length > 2 && (
                        <span className="text-xs text-[#6B8E6A]">+{records.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
