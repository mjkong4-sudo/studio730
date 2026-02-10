import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { addSecurityHeaders, handleCorsPreflight } from "@/lib/middleware"
import { createErrorResponse } from "@/lib/api-error"
import { requireAdmin } from "@/lib/admin-middleware"

export async function GET(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  try {
    await requireAdmin()

    // Get community statistics
    const [
      totalUsers,
      totalRecords,
      totalComments,
      totalReactions,
      activeUsersLast30Days,
      newUsersLast30Days,
      pendingReports,
      blockedUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.record.count({ where: { deleted: false } }),
      prisma.comment.count({ where: { deleted: false } }),
      prisma.reaction.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.report.count({ where: { status: "pending" } }),
      prisma.user.count({ where: { blocked: true } }),
    ])

    // Get records per day for last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recordsLast7Days = await prisma.record.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: sevenDaysAgo },
        deleted: false
      },
      _count: true
    })

    const response = NextResponse.json({
      stats: {
        totalUsers,
        totalRecords,
        totalComments,
        totalReactions,
        activeUsersLast30Days,
        newUsersLast30Days,
        pendingReports,
        blockedUsers,
        recordsLast7Days: recordsLast7Days.length,
      }
    })

    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to fetch admin stats"))
  }
}
