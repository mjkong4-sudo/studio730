import { NextResponse } from "next/server"
import { getServerSessionHelper } from "@/lib/get-session"
import { prisma } from "@/lib/prisma"
import { sanitizeText, validateContentLength, CONTENT_LIMITS } from "@/lib/sanitize"
import { createRateLimitMiddleware } from "@/lib/rate-limit"
import { addSecurityHeaders, handleCorsPreflight } from "@/lib/middleware"
import { createErrorResponse, ApiError, ErrorCodes } from "@/lib/api-error"

// Rate limiting: 20 comments per minute
const commentRateLimit = createRateLimitMiddleware({ limit: 20, window: 60 * 1000 })

export async function POST(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  // Apply rate limiting
  const rateLimitResponse = await commentRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    const body = await request.json()
    const { recordId, content } = body

    if (!recordId || !content) {
      throw new ApiError(400, "Record ID and content are required", ErrorCodes.VALIDATION_ERROR)
    }

    // Validate and sanitize content
    const trimmedContent = content.trim()
    const contentValidation = validateContentLength(trimmedContent, CONTENT_LIMITS.COMMENT_CONTENT)
    if (!contentValidation.valid) {
      throw new ApiError(400, contentValidation.error || "Content validation failed", ErrorCodes.VALIDATION_ERROR)
    }

    const sanitizedContent = sanitizeText(trimmedContent)

    const comment = await prisma.comment.create({
      data: {
        content: sanitizedContent,
        recordId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          }
        }
      }
    })

    // Create notification for record owner (if not the same user)
    const record = await prisma.record.findUnique({
      where: { id: recordId },
      select: { userId: true }
    })

    if (record && record.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "comment",
          message: `${session.user.nickname || session.user.email} commented on your record`,
          link: `/records/${recordId}`,
          userId: record.userId,
        }
      })
    }

    const response = NextResponse.json(comment, { status: 201 })
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to create comment"))
  }
}

