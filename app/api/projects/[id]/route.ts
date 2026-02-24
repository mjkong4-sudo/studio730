import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { addSecurityHeaders, handleCorsPreflight } from "@/lib/middleware"
import { createErrorResponse } from "@/lib/api-error"
import { createRateLimitMiddleware } from "@/lib/rate-limit"
import { getServerSessionHelper } from "@/lib/get-session"
import { ApiError, ErrorCodes } from "@/lib/api-error"
import { sanitizeText } from "@/lib/sanitize"

const getRateLimit = createRateLimitMiddleware({ limit: 60, window: 60 * 1000 })
const putRateLimit = createRateLimitMiddleware({ limit: 20, window: 60 * 1000 })
const deleteRateLimit = createRateLimitMiddleware({ limit: 10, window: 60 * 1000 })

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  const rateLimitResponse = await getRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    const { id } = await params
    const project = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!project) {
      throw new ApiError(404, "Project not found", ErrorCodes.NOT_FOUND)
    }

    const response = NextResponse.json(project)
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to fetch project"))
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  const rateLimitResponse = await putRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    const { id } = await params
    const existing = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      throw new ApiError(404, "Project not found", ErrorCodes.NOT_FOUND)
    }

    let body
    try {
      body = await request.json()
    } catch {
      throw new ApiError(400, "Invalid request body", ErrorCodes.VALIDATION_ERROR)
    }

    const { name, description } = body
    const data: { name?: string; description?: string | null } = {}
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        throw new ApiError(400, "Project name cannot be empty", ErrorCodes.VALIDATION_ERROR)
      }
      data.name = sanitizeText(name.trim())
    }
    if (description !== undefined) {
      data.description = description ? sanitizeText(String(description).trim()) : null
    }

    const project = await prisma.project.update({
      where: { id },
      data,
    })

    const response = NextResponse.json(project)
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to update project"))
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  const rateLimitResponse = await deleteRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    const { id } = await params
    const existing = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      throw new ApiError(404, "Project not found", ErrorCodes.NOT_FOUND)
    }

    await prisma.project.delete({
      where: { id },
    })

    return addSecurityHeaders(new NextResponse(null, { status: 204 }))
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to delete project"))
  }
}
