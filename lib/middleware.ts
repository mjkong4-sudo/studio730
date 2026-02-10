import { NextResponse } from "next/server"

/**
 * Security headers middleware
 * Adds essential security headers to API responses
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // CORS headers (adjust origins for production)
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"]
  const origin = response.headers.get("origin") || ""
  
  if (allowedOrigins.includes(origin) || process.env.NODE_ENV === "development") {
    response.headers.set("Access-Control-Allow-Origin", origin || "*")
  }
  
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  response.headers.set("Access-Control-Max-Age", "86400")

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  
  // Content Security Policy (adjust for your needs)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    )
  }

  return response
}

/**
 * Cache control headers
 */
export function addCacheHeaders(
  response: NextResponse,
  options: {
    maxAge?: number // seconds
    staleWhileRevalidate?: number // seconds
    public?: boolean
    mustRevalidate?: boolean
  } = {}
): NextResponse {
  const {
    maxAge = 60, // 1 minute default
    staleWhileRevalidate,
    public: isPublic = false,
    mustRevalidate = false,
  } = options

  const cacheControl = [
    isPublic ? "public" : "private",
    `max-age=${maxAge}`,
    staleWhileRevalidate ? `stale-while-revalidate=${staleWhileRevalidate}` : null,
    mustRevalidate ? "must-revalidate" : null,
  ]
    .filter(Boolean)
    .join(", ")

  response.headers.set("Cache-Control", cacheControl)
  return response
}

/**
 * Request validation helper
 */
export function validateRequest(
  request: Request,
  requiredFields: string[],
  body: any
): { valid: boolean; error?: string } {
  // Check Content-Type for POST/PUT requests
  if (["POST", "PUT", "PATCH"].includes(request.method)) {
    const contentType = request.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      return {
        valid: false,
        error: "Content-Type must be application/json",
      }
    }
  }

  // Validate required fields
  for (const field of requiredFields) {
    if (!body || body[field] === undefined || body[field] === null) {
      return {
        valid: false,
        error: `Missing required field: ${field}`,
      }
    }
  }

  return { valid: true }
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflight(request: Request): NextResponse | null {
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 200 })
    return addSecurityHeaders(response)
  }
  return null
}
