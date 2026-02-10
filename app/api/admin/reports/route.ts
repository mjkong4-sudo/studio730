import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { addSecurityHeaders, handleCorsPreflight } from "@/lib/middleware"
import { createErrorResponse, ApiError, ErrorCodes } from "@/lib/api-error"
import { requireAdmin } from "@/lib/admin-middleware"

export async function GET(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  try {
    const { admin } = await requireAdmin()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending"
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)

    const pageNum = Math.max(1, page)
    const limitNum = Math.min(Math.max(1, limit), 100)
    const skip = (pageNum - 1) * limitNum

    const where: any = { status }
    if (status === "pending") {
      // Only show pending reports
    }

    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          reportedBy: {
            select: {
              id: true,
              email: true,
              nickname: true,
            }
          },
          record: {
            select: {
              id: true,
              content: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  nickname: true,
                }
              }
            }
          },
          comment: {
            select: {
              id: true,
              content: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  nickname: true,
                }
              }
            }
          },
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.report.count({ where })
    ])

    const response = NextResponse.json({
      reports,
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
    return addSecurityHeaders(createErrorResponse(error, "Failed to fetch reports"))
  }
}

export async function PUT(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  try {
    const { user } = await requireAdmin()

    const body = await request.json()
    const { reportId, status, action } = body

    if (!reportId || !status) {
      throw new ApiError(400, "Report ID and status are required", ErrorCodes.VALIDATION_ERROR)
    }

    const validStatuses = ["pending", "reviewed", "resolved", "dismissed"]
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`, ErrorCodes.VALIDATION_ERROR)
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId }
    })

    if (!report) {
      throw new ApiError(404, "Report not found", ErrorCodes.NOT_FOUND)
    }

    // Handle actions (delete content, block user, etc.)
    if (action === "delete_record" && report.recordId) {
      await prisma.record.update({
        where: { id: report.recordId },
        data: {
          deleted: true,
          deletedAt: new Date(),
          deletedBy: user.id,
        }
      })
    }

    if (action === "delete_comment" && report.commentId) {
      await prisma.comment.update({
        where: { id: report.commentId },
        data: {
          deleted: true,
          deletedAt: new Date(),
          deletedBy: user.id,
        }
      })
    }

    if (action === "block_user" && report.reportedUserId) {
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { blocked: true }
      })
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
      include: {
        reportedBy: {
          select: {
            id: true,
            email: true,
            nickname: true,
          }
        }
      }
    })

    const response = NextResponse.json(updatedReport)
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to update report"))
  }
}
