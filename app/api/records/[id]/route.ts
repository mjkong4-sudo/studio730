import { NextResponse } from "next/server"
import { getServerSessionHelper } from "@/lib/get-session"
import { prisma } from "@/lib/prisma"
import { sanitizeText, validateContentLength, CONTENT_LIMITS } from "@/lib/sanitize"
import { createRateLimitMiddleware } from "@/lib/rate-limit"
import { addSecurityHeaders, addCacheHeaders, handleCorsPreflight } from "@/lib/middleware"
import { createErrorResponse, ApiError, ErrorCodes } from "@/lib/api-error"

// Rate limiting: 30 requests per minute for GET, 10 per minute for PUT
const getRateLimit = createRateLimitMiddleware({ limit: 30, window: 60 * 1000 })
const putRateLimit = createRateLimitMiddleware({ limit: 10, window: 60 * 1000 })

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  // Apply rate limiting
  const rateLimitResponse = await getRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)
  try {
    const { id } = await params
    const record = await prisma.record.findUnique({
      where: { id },
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

    if (!record) {
      throw new ApiError(404, "Record not found", ErrorCodes.NOT_FOUND)
    }

    const response = NextResponse.json(record)
    // Cache individual records for 1 minute
    addCacheHeaders(response, { maxAge: 60, staleWhileRevalidate: 120, public: true })
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to fetch record"))
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  // Apply rate limiting
  const rateLimitResponse = await putRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    const { id } = await params

    // Check if record exists and user owns it
    const existingRecord = await prisma.record.findUnique({
      where: { id }
    })

    if (!existingRecord) {
      throw new ApiError(404, "Record not found", ErrorCodes.NOT_FOUND)
    }

    if (existingRecord.userId !== session.user.id) {
      throw new ApiError(403, "Forbidden - You can only edit your own records", ErrorCodes.FORBIDDEN)
    }

    const body = await request.json()
    const { date, city, content, gathering, imageUrl } = body

    if (!date || !content || !gathering) {
      throw new ApiError(400, "Date, gathering, and content are required", ErrorCodes.VALIDATION_ERROR)
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

    const record = await prisma.record.update({
      where: { id },
      data: {
        date: new Date(date),
        city: sanitizedCity,
        content: sanitizedContent,
        gathering: sanitizedGathering,
        imageUrl: imageUrl || null,
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

    const response = NextResponse.json(record)
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to update record"))
  }
}

