import { NextResponse } from "next/server"
import { getServerSessionHelper } from "@/lib/get-session"
import { prisma } from "@/lib/prisma"
import { sanitizeText, validateContentLength, CONTENT_LIMITS } from "@/lib/sanitize"
import { createRateLimitMiddleware } from "@/lib/rate-limit"
import { addSecurityHeaders, addCacheHeaders, handleCorsPreflight } from "@/lib/middleware"
import { createErrorResponse, ApiError, ErrorCodes } from "@/lib/api-error"

// Rate limiting: 60 requests per minute for GET, 10 per minute for POST
const getRateLimit = createRateLimitMiddleware({ limit: 60, window: 60 * 1000 })
const postRateLimit = createRateLimitMiddleware({ limit: 10, window: 60 * 1000 })

export async function GET(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  // Apply rate limiting
  const rateLimitResponse = await getRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const gathering = searchParams.get("gathering")
    const groupId = searchParams.get("groupId")
    const projectId = searchParams.get("projectId")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const search = searchParams.get("search")
    const mine = searchParams.get("mine") === "true"

    // Validate pagination parameters
    const pageNum = Math.max(1, page)
    const limitNum = Math.min(Math.max(1, limit), 100) // Max 100 records per page
    const skip = (pageNum - 1) * limitNum

    // Get session early for mine filter
    const session = await getServerSessionHelper()
    const currentUserId = session?.user?.id

    // Build where clause for filtering
    const andConditions: any[] = [{ deleted: false }]
    if (mine && currentUserId) {
      andConditions.push({ userId: currentUserId })
    }
    if (groupId && groupId !== "all") {
      andConditions.push({ groupId })
    } else if (gathering && gathering !== "all") {
      andConditions.push({
        OR: [{ gathering }, { group: { name: gathering } }],
      })
    }
    if (projectId && projectId !== "all") {
      andConditions.push({ projectId })
    }
    if (from || to) {
      const dateFilter: { date?: { gte?: Date; lte?: Date } } = {}
      if (from) dateFilter.date = { ...dateFilter.date, gte: new Date(from) }
      if (to) dateFilter.date = { ...dateFilter.date, lte: new Date(to) }
      if (dateFilter.date) andConditions.push(dateFilter)
    }
    if (search && search.trim()) {
      andConditions.push({
        OR: [
          { content: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
          { gathering: { contains: search, mode: "insensitive" } },
          {
            user: {
              OR: [
                { nickname: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      })
    }
    const where = andConditions.length === 1 ? andConditions[0] : { AND: andConditions }

    // Get total count for pagination
    const totalCount = await prisma.record.count({ where })
    const totalPages = Math.ceil(totalCount / limitNum)

    // Fetch paginated records
    const records = await prisma.record.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
            firstName: true,
            lastName: true,
            city: true,
            country: true,
          }
        },
        group: {
          select: {
            id: true,
            name: true,
          }
        },
        project: {
          select: {
            id: true,
            name: true,
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                nickname: true,
              }
            }
          },
          orderBy: {
            createdAt: "asc"
          }
        },
        reactions: {
          select: {
            id: true,
            type: true,
            userId: true,
          }
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          }
        }
      },
      orderBy: {
        date: "desc"
      }
    })

    // Add user's reaction status to each record
    const recordsWithReactions = records.map(record => ({
      ...record,
      userReaction: currentUserId
        ? record.reactions.find(r => r.userId === currentUserId)
        : null,
      reactionCounts: {
        like: record.reactions.filter(r => r.type === "like").length,
        heart: record.reactions.filter(r => r.type === "heart").length,
        "thumbs-up": record.reactions.filter(r => r.type === "thumbs-up").length,
      }
    }))

    const response = NextResponse.json({
      records: recordsWithReactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasMore: pageNum < totalPages
      }
    })

    // Add security headers and cache headers (cache for 30 seconds)
    addSecurityHeaders(response)
    addCacheHeaders(response, { maxAge: 30, staleWhileRevalidate: 60, public: true })

    return response
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to fetch records"))
  }
}

export async function POST(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  // Apply rate limiting
  const rateLimitResponse = await postRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    // Verify user still exists in DB (handles deleted users with stale sessions)
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    })
    if (!userExists) {
      throw new ApiError(401, "Your account may have been removed. Please sign in again.", ErrorCodes.UNAUTHORIZED)
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { date, city, content, gathering, groupId: bodyGroupId, projectId: bodyProjectId, imageUrl } = body
    console.log("Received form data:", { date, city, content: content?.substring(0, 50), gathering })

    if (!date || !content) {
      throw new ApiError(400, "Date and content are required", ErrorCodes.VALIDATION_ERROR)
    }

    const groupIdOrGathering = bodyGroupId || gathering
    if (!groupIdOrGathering || (typeof groupIdOrGathering === "string" && groupIdOrGathering.trim() === "")) {
      throw new ApiError(400, "Please select a group", ErrorCodes.VALIDATION_ERROR)
    }

    // Resolve groupId and gathering: prefer groupId, fallback to gathering by name
    let resolvedGroupId: string | null = null
    let resolvedGathering: string | null = null
    if (bodyGroupId && typeof bodyGroupId === "string") {
      const group = await prisma.group.findUnique({
        where: { id: bodyGroupId },
        select: { id: true, name: true },
      })
      if (group) {
        resolvedGroupId = group.id
        resolvedGathering = group.name
      }
    }
    if (!resolvedGroupId && gathering) {
      const group = await prisma.group.findFirst({
        where: { name: sanitizeText(String(gathering).trim()) },
        select: { id: true, name: true },
      })
      if (group) {
        resolvedGroupId = group.id
        resolvedGathering = group.name
      } else {
        resolvedGathering = typeof gathering === "string" ? sanitizeText(gathering.trim()) : String(gathering)
      }
    }

    // Validate and sanitize content
    const trimmedContent = content.trim()
    const contentValidation = validateContentLength(trimmedContent, CONTENT_LIMITS.RECORD_CONTENT)
    if (!contentValidation.valid) {
      throw new ApiError(400, contentValidation.error || "Content validation failed", ErrorCodes.VALIDATION_ERROR)
    }

    // Sanitize all user inputs
    const sanitizedContent = sanitizeText(trimmedContent)
    const sanitizedCity = city ? sanitizeText(city.trim()) : ""

    let resolvedProjectId: string | null = null
    if (bodyProjectId && typeof bodyProjectId === "string" && bodyProjectId.trim()) {
      const project = await prisma.project.findFirst({
        where: { id: bodyProjectId.trim(), userId: session.user.id },
        select: { id: true },
      })
      if (project) resolvedProjectId = project.id
    }

    try {
      const record = await prisma.record.create({
        data: {
          date: new Date(date),
          city: sanitizedCity,
          content: sanitizedContent,
          gathering: resolvedGathering,
          groupId: resolvedGroupId,
          projectId: resolvedProjectId,
          imageUrl: imageUrl || null,
          userId: session.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true,
              firstName: true,
              lastName: true,
              city: true,
              country: true,
            }
          }
        }
      })

      const response = NextResponse.json(record, { status: 201 })
      return addSecurityHeaders(response)
    } catch (dbError: any) {
      throw new ApiError(500, `Failed to save record: ${dbError?.message || "Database error"}`, "DATABASE_ERROR")
    }
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to create record"))
  }
}

