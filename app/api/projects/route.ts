import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { addSecurityHeaders, handleCorsPreflight } from "@/lib/middleware"
import { createErrorResponse } from "@/lib/api-error"
import { createRateLimitMiddleware } from "@/lib/rate-limit"
import { getServerSessionHelper } from "@/lib/get-session"
import { ApiError, ErrorCodes } from "@/lib/api-error"
import { sanitizeText } from "@/lib/sanitize"

const getRateLimit = createRateLimitMiddleware({ limit: 60, window: 60 * 1000 })
const postRateLimit = createRateLimitMiddleware({ limit: 20, window: 60 * 1000 })

export async function GET(request: Request) {
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  const rateLimitResponse = await getRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    })

    const response = NextResponse.json({ projects })
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to fetch projects"))
  }
}

export async function POST(request: Request) {
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  const rateLimitResponse = await postRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    let body
    try {
      body = await request.json()
    } catch {
      throw new ApiError(400, "Invalid request body", ErrorCodes.VALIDATION_ERROR)
    }

    const { name, description } = body
    if (!name || typeof name !== "string" || !name.trim()) {
      throw new ApiError(400, "Project name is required", ErrorCodes.VALIDATION_ERROR)
    }

    const sanitizedName = sanitizeText(name.trim())
    const sanitizedDescription = description ? sanitizeText(String(description).trim()) : null

    const project = await prisma.project.create({
      data: {
        name: sanitizedName,
        description: sanitizedDescription,
        userId: session.user.id,
      },
    })

    const response = NextResponse.json(project, { status: 201 })
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to create project"))
  }
}
