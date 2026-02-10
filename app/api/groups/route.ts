import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { addSecurityHeaders, addCacheHeaders, handleCorsPreflight } from "@/lib/middleware"
import { createErrorResponse } from "@/lib/api-error"
import { createRateLimitMiddleware } from "@/lib/rate-limit"

// Rate limiting: 60 requests per minute
const getRateLimit = createRateLimitMiddleware({ limit: 60, window: 60 * 1000 })

// Define available groups
const AVAILABLE_GROUPS = [
  {
    id: "studio-730-cupertino",
    name: "Studio 7:30 (Cupertino)",
    location: "Cupertino",
    day: "Thursday",
    time: "7:30 PM",
    description: "Join us every Thursday at 7:30 PM in Cupertino"
  },
  {
    id: "studio-800-palo-alto",
    name: "Studio 8:00 (Palo Alto)",
    location: "Palo Alto",
    day: "Sunday",
    time: "8:00 AM",
    description: "Join us every Sunday at 8:00 AM in Palo Alto"
  }
]

export async function GET(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  // Apply rate limiting
  const rateLimitResponse = await getRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    // Get statistics for each group
    const groupsWithStats = await Promise.all(
      AVAILABLE_GROUPS.map(async (group) => {
        // Count records for this group
        const recordCount = await prisma.record.count({
          where: {
            gathering: group.name,
            deleted: false
          }
        })

        // Count unique members (users who have created records)
        const memberCount = await prisma.record.groupBy({
          by: ['userId'],
          where: {
            gathering: group.name,
            deleted: false
          }
        }).then(result => result.length)

        // Get most recent record
        const recentRecord = await prisma.record.findFirst({
          where: {
            gathering: group.name,
            deleted: false
          },
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            createdAt: true,
            user: {
              select: {
                nickname: true,
                email: true
              }
            }
          }
        })

        return {
          ...group,
          stats: {
            recordCount,
            memberCount,
            lastActivity: recentRecord?.createdAt || null,
            lastActivityBy: recentRecord?.user.nickname || recentRecord?.user.email || null
          }
        }
      })
    )

    const response = NextResponse.json({ groups: groupsWithStats })
    addCacheHeaders(response, { maxAge: 60, staleWhileRevalidate: 120, public: true })
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to fetch groups"))
  }
}
