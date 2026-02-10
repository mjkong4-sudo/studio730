import { NextResponse } from "next/server"
import { getServerSessionHelper } from "@/lib/get-session"
import { prisma } from "@/lib/prisma"
import { sanitizeText, validateContentLength, CONTENT_LIMITS } from "@/lib/sanitize"
import { createRateLimitMiddleware } from "@/lib/rate-limit"
import { addSecurityHeaders, handleCorsPreflight } from "@/lib/middleware"
import { createErrorResponse, ApiError, ErrorCodes } from "@/lib/api-error"

// Rate limiting: 20 comment updates per minute
const updateRateLimit = createRateLimitMiddleware({ limit: 20, window: 60 * 1000 })

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  // Apply rate limiting
  const rateLimitResponse = await updateRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    const { id } = await params

    // Check if comment exists and user owns it
    const existingComment = await prisma.comment.findUnique({
      where: { id }
    })

    if (!existingComment) {
      throw new ApiError(404, "Comment not found", ErrorCodes.NOT_FOUND)
    }

    if (existingComment.userId !== session.user.id) {
      throw new ApiError(403, "Forbidden - You can only edit your own comments", ErrorCodes.FORBIDDEN)
    }

    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      throw new ApiError(400, "Content is required", ErrorCodes.VALIDATION_ERROR)
    }

    // Validate and sanitize content
    const trimmedContent = content.trim()
    const contentValidation = validateContentLength(trimmedContent, CONTENT_LIMITS.COMMENT_CONTENT)
    if (!contentValidation.valid) {
      throw new ApiError(400, contentValidation.error || "Content validation failed", ErrorCodes.VALIDATION_ERROR)
    }

    const sanitizedContent = sanitizeText(trimmedContent)

    const comment = await prisma.comment.update({
      where: { id },
      data: {
        content: sanitizedContent,
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

    const response = NextResponse.json(comment)
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to update comment"))
  }
}

