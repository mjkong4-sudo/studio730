import { NextResponse } from "next/server"
import { getServerSessionHelper } from "@/lib/get-session"
import { prisma } from "@/lib/prisma"
import { addSecurityHeaders, handleCorsPreflight } from "@/lib/middleware"
import { createErrorResponse, ApiError, ErrorCodes } from "@/lib/api-error"
import { createRateLimitMiddleware } from "@/lib/rate-limit"

// Rate limiting: 30 reactions per minute
const reactionRateLimit = createRateLimitMiddleware({ limit: 30, window: 60 * 1000 })

export async function POST(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  // Apply rate limiting
  const rateLimitResponse = await reactionRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    const body = await request.json()
    const { recordId, type } = body

    if (!recordId || !type) {
      throw new ApiError(400, "Record ID and reaction type are required", ErrorCodes.VALIDATION_ERROR)
    }

    // Validate reaction type
    const validTypes = ["like", "heart", "thumbs-up"]
    if (!validTypes.includes(type)) {
      throw new ApiError(400, `Invalid reaction type. Must be one of: ${validTypes.join(", ")}`, ErrorCodes.VALIDATION_ERROR)
    }

    // Check if record exists
    const record = await prisma.record.findUnique({
      where: { id: recordId }
    })

    if (!record) {
      throw new ApiError(404, "Record not found", ErrorCodes.NOT_FOUND)
    }

    // Check if user already reacted with this type
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        recordId_userId_type: {
          recordId,
          userId: session.user.id,
          type
        }
      }
    })

    if (existingReaction) {
      // User already reacted, return existing reaction
      const reaction = await prisma.reaction.findUnique({
        where: { id: existingReaction.id },
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
      const response = NextResponse.json(reaction)
      return addSecurityHeaders(response)
    }

    // Create new reaction
    const reaction = await prisma.reaction.create({
      data: {
        recordId,
        userId: session.user.id,
        type
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
    if (record.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "reaction",
          message: `${session.user.nickname || session.user.email} reacted with ${type} to your record`,
          link: `/records/${recordId}`,
          userId: record.userId,
        }
      })
    }

    const response = NextResponse.json(reaction, { status: 201 })
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to create reaction"))
  }
}

export async function DELETE(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  // Apply rate limiting
  const rateLimitResponse = await reactionRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get("recordId")
    const type = searchParams.get("type")

    if (!recordId || !type) {
      throw new ApiError(400, "Record ID and reaction type are required", ErrorCodes.VALIDATION_ERROR)
    }

    // Delete reaction
    const reaction = await prisma.reaction.findUnique({
      where: {
        recordId_userId_type: {
          recordId,
          userId: session.user.id,
          type
        }
      }
    })

    if (!reaction) {
      throw new ApiError(404, "Reaction not found", ErrorCodes.NOT_FOUND)
    }

    await prisma.reaction.delete({
      where: { id: reaction.id }
    })

    const response = NextResponse.json({ success: true })
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to delete reaction"))
  }
}
