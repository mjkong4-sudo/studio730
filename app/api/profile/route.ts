import { NextResponse } from "next/server"
import { getServerSessionHelper } from "@/lib/get-session"
import { prisma } from "@/lib/prisma"
import { sanitizeText, validateContentLength, CONTENT_LIMITS } from "@/lib/sanitize"
import { verifyPassword } from "@/lib/password"
import { createRateLimitMiddleware } from "@/lib/rate-limit"
import { addSecurityHeaders, addCacheHeaders, handleCorsPreflight } from "@/lib/middleware"
import { createErrorResponse, ApiError, ErrorCodes } from "@/lib/api-error"

// Rate limiting: 30 profile requests per minute
const profileRateLimit = createRateLimitMiddleware({ limit: 30, window: 60 * 1000 })

export async function GET(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  // Apply rate limiting
  const rateLimitResponse = await profileRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        nickname: true,
        firstName: true,
        lastName: true,
        city: true,
        country: true,
        bio: true,
      }
    })

    if (!user) {
      throw new ApiError(404, "User not found", ErrorCodes.NOT_FOUND)
    }

    const response = NextResponse.json(user)
    // Cache profile for 5 minutes (private cache)
    addCacheHeaders(response, { maxAge: 300, public: false })
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to fetch profile"))
  }
}

export async function PUT(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  // Apply rate limiting (stricter for updates: 5 per minute)
  const updateRateLimit = createRateLimitMiddleware({ limit: 5, window: 60 * 1000 })
  const rateLimitResponse = await updateRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    const body = await request.json()
    const { nickname, firstName, lastName, city, country, bio } = body

    // Validate and sanitize all fields
    const sanitizedNickname = nickname ? sanitizeText(nickname.trim()) : null
    const sanitizedFirstName = firstName ? sanitizeText(firstName.trim()) : null
    const sanitizedLastName = lastName ? sanitizeText(lastName.trim()) : null
    const sanitizedCity = city ? sanitizeText(city.trim()) : null
    const sanitizedCountry = country ? sanitizeText(country.trim()) : null
    const sanitizedBio = bio ? sanitizeText(bio.trim()) : null

    // Validate lengths
    if (sanitizedNickname && sanitizedNickname.length > CONTENT_LIMITS.NICKNAME_LENGTH) {
      throw new ApiError(400, `Nickname exceeds maximum length of ${CONTENT_LIMITS.NICKNAME_LENGTH} characters`, ErrorCodes.VALIDATION_ERROR)
    }

    if (sanitizedBio) {
      const bioValidation = validateContentLength(sanitizedBio, CONTENT_LIMITS.BIO_CONTENT)
      if (!bioValidation.valid) {
        throw new ApiError(400, bioValidation.error || "Bio validation failed", ErrorCodes.VALIDATION_ERROR)
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        nickname: sanitizedNickname,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        city: sanitizedCity,
        country: sanitizedCountry,
        bio: sanitizedBio,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        firstName: true,
        lastName: true,
        city: true,
        country: true,
        bio: true,
      }
    })

    const response = NextResponse.json(user)
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to update profile"))
  }
}

export async function DELETE(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  // Apply rate limiting (very strict for deletion: 2 per hour)
  const deleteRateLimit = createRateLimitMiddleware({ limit: 2, window: 60 * 60 * 1000 })
  const rateLimitResponse = await deleteRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    const body = await request.json()
    const { password } = body

    if (!password) {
      throw new ApiError(400, "Password is required to delete your account", ErrorCodes.VALIDATION_ERROR)
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        password: true,
      }
    })

    if (!user) {
      throw new ApiError(404, "User not found", ErrorCodes.NOT_FOUND)
    }

    // Verify password
    if (!user.password) {
      throw new ApiError(400, "Account has no password set. Cannot verify identity.", ErrorCodes.VALIDATION_ERROR)
    }

    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      throw new ApiError(401, "Invalid password", ErrorCodes.UNAUTHORIZED)
    }

    // Delete user (cascade will handle related records, comments, reactions, etc.)
    await prisma.user.delete({
      where: { id: session.user.id }
    })

    const response = NextResponse.json(
      { message: "Account deleted successfully" },
      { status: 200 }
    )

    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to delete account"))
  }
}

