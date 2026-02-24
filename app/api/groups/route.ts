import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { addSecurityHeaders, addCacheHeaders, handleCorsPreflight } from "@/lib/middleware"
import { createErrorResponse } from "@/lib/api-error"
import { createRateLimitMiddleware } from "@/lib/rate-limit"
import { getServerSessionHelper } from "@/lib/get-session"
import { ApiError, ErrorCodes } from "@/lib/api-error"
import { sanitizeText } from "@/lib/sanitize"

// Rate limiting: 60 requests per minute for GET, 10 per minute for POST
const getRateLimit = createRateLimitMiddleware({ limit: 60, window: 60 * 1000 })
const postRateLimit = createRateLimitMiddleware({ limit: 10, window: 60 * 1000 })

export async function GET(request: Request) {
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  const rateLimitResponse = await getRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const groups = await prisma.group.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        createdBy: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
      },
    })

    const groupsWithStats = await Promise.all(
      groups.map(async (group) => {
        const recordWhere = {
          deleted: false,
          OR: [{ groupId: group.id }, { gathering: group.name }],
        }

        const recordCount = await prisma.record.count({ where: recordWhere })

        const memberResult = await prisma.record.groupBy({
          by: ["userId"],
          where: recordWhere,
        })
        const memberCount = memberResult.length

        const recentRecord = await prisma.record.findFirst({
          where: recordWhere,
          orderBy: { createdAt: "desc" },
          select: {
            createdAt: true,
            user: {
              select: {
                nickname: true,
                email: true,
              },
            },
          },
        })

        return {
          id: group.id,
          name: group.name,
          location: group.location,
          day: group.day,
          time: group.time,
          description: group.description,
          createdById: group.createdById,
          createdBy: group.createdBy,
          stats: {
            recordCount,
            memberCount,
            lastActivity: recentRecord?.createdAt?.toISOString() || null,
            lastActivityBy: recentRecord?.user?.nickname || recentRecord?.user?.email || null,
          },
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

export async function POST(request: Request) {
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  const rateLimitResponse = await postRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    let body
    try {
      body = await request.json()
    } catch {
      throw new ApiError(400, "Invalid request body", ErrorCodes.VALIDATION_ERROR)
    }

    const { name, location, day, time, description } = body
    if (!name || typeof name !== "string" || !name.trim()) {
      throw new ApiError(400, "Group name is required", ErrorCodes.VALIDATION_ERROR)
    }

    const sanitizedName = sanitizeText(name.trim())
    const sanitizedLocation = location ? sanitizeText(String(location).trim()) : null
    const sanitizedDay = day ? sanitizeText(String(day).trim()) : null
    const sanitizedTime = time ? sanitizeText(String(time).trim()) : null
    const sanitizedDescription = description ? sanitizeText(String(description).trim()) : null

    const group = await prisma.group.create({
      data: {
        name: sanitizedName,
        location: sanitizedLocation,
        day: sanitizedDay,
        time: sanitizedTime,
        description: sanitizedDescription,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
      },
    })

    const response = NextResponse.json(
      {
        id: group.id,
        name: group.name,
        location: group.location,
        day: group.day,
        time: group.time,
        description: group.description,
        createdBy: group.createdBy,
        stats: { recordCount: 0, memberCount: 0, lastActivity: null, lastActivityBy: null },
      },
      { status: 201 }
    )
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to create group"))
  }
}
