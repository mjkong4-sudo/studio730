import { NextResponse } from "next/server"
import { getServerSessionHelper } from "@/lib/get-session"
import { prisma } from "@/lib/prisma"
import { addSecurityHeaders, handleCorsPreflight } from "@/lib/middleware"
import { createErrorResponse, ApiError, ErrorCodes } from "@/lib/api-error"
import { createRateLimitMiddleware } from "@/lib/rate-limit"

// Rate limiting: 30 requests per minute
const notificationRateLimit = createRateLimitMiddleware({ limit: 30, window: 60 * 1000 })

export async function GET(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  // Apply rate limiting
  const rateLimitResponse = await notificationRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unreadOnly") === "true"
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const limitNum = Math.min(Math.max(1, limit), 100)

    const where: any = { userId: session.user.id }
    if (unreadOnly) {
      where.read = false
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        take: limitNum,
        orderBy: { createdAt: "desc" }
      }),
      prisma.notification.count({
        where: { userId: session.user.id, read: false }
      })
    ])

    const response = NextResponse.json({
      notifications,
      unreadCount
    })
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to fetch notifications"))
  }
}

export async function PUT(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  // Apply rate limiting
  const rateLimitResponse = await notificationRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    const body = await request.json()
    const { notificationId, markAllAsRead } = body

    if (markAllAsRead) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true }
      })

      const response = NextResponse.json({ success: true })
      return addSecurityHeaders(response)
    }

    if (!notificationId) {
      throw new ApiError(400, "Notification ID is required", ErrorCodes.VALIDATION_ERROR)
    }

    // Mark single notification as read
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    })

    if (!notification) {
      throw new ApiError(404, "Notification not found", ErrorCodes.NOT_FOUND)
    }

    if (notification.userId !== session.user.id) {
      throw new ApiError(403, "Forbidden", ErrorCodes.FORBIDDEN)
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    })

    const response = NextResponse.json(updated)
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to update notification"))
  }
}
