import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { addSecurityHeaders, handleCorsPreflight } from "@/lib/middleware"
import { createErrorResponse, ApiError, ErrorCodes } from "@/lib/api-error"
import { requireAdmin } from "@/lib/admin-middleware"
import { sanitizeText } from "@/lib/sanitize"

export async function GET(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const search = searchParams.get("search")
    const role = searchParams.get("role")
    const blocked = searchParams.get("blocked")

    const pageNum = Math.max(1, page)
    const limitNum = Math.min(Math.max(1, limit), 100)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { nickname: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ]
    }
    if (role) {
      where.role = role
    }
    if (blocked !== null) {
      where.blocked = blocked === "true"
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          nickname: true,
          firstName: true,
          lastName: true,
          role: true,
          blocked: true,
          createdAt: true,
          _count: {
            select: {
              records: true,
              comments: true,
              reactions: true,
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.user.count({ where })
    ])

    const response = NextResponse.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        hasMore: pageNum < Math.ceil(totalCount / limitNum)
      }
    })

    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to fetch users"))
  }
}

export async function PUT(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  try {
    await requireAdmin()

    const body = await request.json()
    const { userId, role, blocked } = body

    if (!userId) {
      throw new ApiError(400, "User ID is required", ErrorCodes.VALIDATION_ERROR)
    }

    const updateData: any = {}
    if (role !== undefined) {
      if (!["user", "admin", "moderator"].includes(role)) {
        throw new ApiError(400, "Invalid role", ErrorCodes.VALIDATION_ERROR)
      }
      updateData.role = role
    }
    if (blocked !== undefined) {
      updateData.blocked = blocked
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        blocked: true,
      }
    })

    const response = NextResponse.json(user)
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to update user"))
  }
}
