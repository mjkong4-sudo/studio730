import { NextResponse } from "next/server"
import { getServerSessionHelper } from "@/lib/get-session"
import { prisma } from "@/lib/prisma"
import { addSecurityHeaders, handleCorsPreflight } from "@/lib/middleware"
import { createErrorResponse, ApiError, ErrorCodes } from "@/lib/api-error"
import { createRateLimitMiddleware } from "@/lib/rate-limit"
import { sanitizeText } from "@/lib/sanitize"

// Rate limiting: 5 reports per hour
const reportRateLimit = createRateLimitMiddleware({ limit: 5, window: 60 * 60 * 1000 })

export async function POST(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  // Apply rate limiting
  const rateLimitResponse = await reportRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    const body = await request.json()
    const { type, reason, description, recordId, commentId, reportedUserId } = body

    if (!type || !reason) {
      throw new ApiError(400, "Type and reason are required", ErrorCodes.VALIDATION_ERROR)
    }

    const validTypes = ["record", "comment", "user"]
    const validReasons = ["spam", "inappropriate", "harassment", "other"]

    if (!validTypes.includes(type)) {
      throw new ApiError(400, `Invalid type. Must be one of: ${validTypes.join(", ")}`, ErrorCodes.VALIDATION_ERROR)
    }

    if (!validReasons.includes(reason)) {
      throw new ApiError(400, `Invalid reason. Must be one of: ${validReasons.join(", ")}`, ErrorCodes.VALIDATION_ERROR)
    }

    // Validate that at least one target is provided
    if (type === "record" && !recordId) {
      throw new ApiError(400, "Record ID is required for record reports", ErrorCodes.VALIDATION_ERROR)
    }
    if (type === "comment" && !commentId) {
      throw new ApiError(400, "Comment ID is required for comment reports", ErrorCodes.VALIDATION_ERROR)
    }
    if (type === "user" && !reportedUserId) {
      throw new ApiError(400, "User ID is required for user reports", ErrorCodes.VALIDATION_ERROR)
    }

    // Sanitize description
    const sanitizedDescription = description ? sanitizeText(description.trim()) : null

    const report = await prisma.report.create({
      data: {
        type,
        reason,
        description: sanitizedDescription,
        reportedById: session.user.id,
        recordId: type === "record" ? recordId : null,
        commentId: type === "comment" ? commentId : null,
        reportedUserId: type === "user" ? reportedUserId : null,
      }
    })

    const response = NextResponse.json(report, { status: 201 })
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to create report"))
  }
}
