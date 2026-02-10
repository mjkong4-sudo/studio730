import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { addSecurityHeaders, addCacheHeaders, handleCorsPreflight } from "@/lib/middleware"
import { createErrorResponse, ApiError, ErrorCodes } from "@/lib/api-error"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  try {
    const { id } = await params

    // Get user profile with stats
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nickname: true,
        firstName: true,
        lastName: true,
        city: true,
        country: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            records: true,
            comments: true,
            reactions: true,
          }
        }
      }
    })

    if (!user) {
      throw new ApiError(404, "User not found", ErrorCodes.NOT_FOUND)
    }

    // Get user's recent records (paginated)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "10", 10)
    const pageNum = Math.max(1, page)
    const limitNum = Math.min(Math.max(1, limit), 50)
    const skip = (pageNum - 1) * limitNum

    const [records, totalRecords] = await Promise.all([
      prisma.record.findMany({
        where: { userId: id },
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
            orderBy: { createdAt: "asc" },
            take: 3 // Only get first 3 comments for preview
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
        orderBy: { date: "desc" }
      }),
      prisma.record.count({ where: { userId: id } })
    ])

    const response = NextResponse.json({
      user: {
        ...user,
        stats: {
          recordsCount: user._count.records,
          commentsCount: user._count.comments,
          reactionsCount: user._count.reactions,
        }
      },
      records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount: totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum),
        hasMore: pageNum < Math.ceil(totalRecords / limitNum)
      }
    })

    // Cache user profiles for 2 minutes
    addCacheHeaders(response, { maxAge: 120, staleWhileRevalidate: 60, public: true })
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to fetch user profile"))
  }
}
