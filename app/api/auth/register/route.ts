import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { addSecurityHeaders } from "@/lib/middleware"
import { createErrorResponse, ApiError, ErrorCodes } from "@/lib/api-error"
import { createRateLimitMiddleware } from "@/lib/rate-limit"

// Rate limiting: 5 signups per minute
const signupRateLimit = createRateLimitMiddleware({ limit: 5, window: 60 * 1000 })

export async function POST(request: Request) {
  // Apply rate limiting
  const rateLimitResponse = await signupRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required", ErrorCodes.VALIDATION_ERROR)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Invalid email format", ErrorCodes.VALIDATION_ERROR)
    }

    // Validate password length
    if (password.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters long", ErrorCodes.VALIDATION_ERROR)
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser) {
      throw new ApiError(409, "User with this email already exists", ErrorCodes.VALIDATION_ERROR)
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: new Date(), // Mark as verified
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true,
      }
    })

    const response = NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
        }
      },
      { status: 201 }
    )

    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to create account"))
  }
}
