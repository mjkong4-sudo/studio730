import { NextResponse } from "next/server"
import { getServerSessionHelper } from "@/lib/get-session"
import { addSecurityHeaders, handleCorsPreflight } from "@/lib/middleware"
import { createErrorResponse, ApiError, ErrorCodes } from "@/lib/api-error"
import { createRateLimitMiddleware } from "@/lib/rate-limit"

// Rate limiting: 10 uploads per minute
const uploadRateLimit = createRateLimitMiddleware({ limit: 10, window: 60 * 1000 })

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

export async function POST(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  // Apply rate limiting
  const rateLimitResponse = await uploadRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    const session = await getServerSessionHelper()
    
    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      throw new ApiError(400, "No file provided", ErrorCodes.VALIDATION_ERROR)
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new ApiError(
        400,
        `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
        ErrorCodes.VALIDATION_ERROR
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new ApiError(
        400,
        `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        ErrorCodes.VALIDATION_ERROR
      )
    }

    // Convert file to base64 data URL
    // In production, you'd upload to Vercel Blob, Cloudinary, or S3
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const dataUrl = `data:${file.type};base64,${base64}`

    // For now, return the data URL
    // In production, upload to storage and return the public URL
    const response = NextResponse.json({
      url: dataUrl,
      type: file.type,
      size: file.size,
      // Note: For production, use Vercel Blob or Cloudinary:
      // const blob = await put(file.name, buffer, { access: 'public' })
      // return { url: blob.url }
    })

    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to upload image"))
  }
}
