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

// Handle CORS preflight requests
export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request) || new NextResponse(null, { status: 200 })
}

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
    const search = searchParams.get("search")
    
    // Validate pagination parameters
    const pageNum = Math.max(1, page)
    const limitNum = Math.min(Math.max(1, limit), 100) // Max 100 records per page
    const skip = (pageNum - 1) * limitNum

    // Build where clause for filtering
    const where: any = { deleted: false }
    if (gathering && gathering !== "all") {
      where.gathering = gathering
    }
    if (search && search.trim()) {
      where.OR = [
        { content: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { gathering: { contains: search, mode: "insensitive" } },
        { user: { 
          OR: [
            { nickname: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } }
          ]
        }}
      ]
    }

    // Get total count for pagination
    const totalCount = await prisma.record.count({ where })
    const totalPages = Math.ceil(totalCount / limitNum)

    // Get session to check user's reactions
    const session = await getServerSessionHelper()
    const currentUserId = session?.user?.id

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

    const { date, city, content, gathering, imageUrl } = body
    console.log("Received form data:", { date, city, content: content?.substring(0, 50), gathering })

    if (!date || !content) {
      throw new ApiError(400, "Date and content are required", ErrorCodes.VALIDATION_ERROR)
    }

    if (!gathering || (typeof gathering === "string" && gathering.trim() === "")) {
      throw new ApiError(400, "Please select a gathering", ErrorCodes.VALIDATION_ERROR)
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
    const sanitizedGathering = typeof gathering === "string" ? sanitizeText(gathering.trim()) : gathering

    try {
      const record = await prisma.record.create({
        data: {
          date: new Date(date),
          city: sanitizedCity,
          content: sanitizedContent,
          gathering: sanitizedGathering,
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

