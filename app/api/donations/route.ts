import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { addSecurityHeaders, handleCorsPreflight } from "@/lib/middleware"
import { createErrorResponse } from "@/lib/api-error"
import { createRateLimitMiddleware } from "@/lib/rate-limit"
import { getServerSessionHelper } from "@/lib/get-session"
import { ApiError, ErrorCodes } from "@/lib/api-error"
import Stripe from "stripe"

const postRateLimit = createRateLimitMiddleware({ limit: 10, window: 60 * 1000 })
const getRateLimit = createRateLimitMiddleware({ limit: 60, window: 60 * 1000 })

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

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

    const donations = await prisma.donation.findMany({
      where: { donorId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const response = NextResponse.json({
      donations: donations.map(d => ({
        ...d,
        amount: Number(d.amount),
      })),
    })
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to fetch donations"))
  }
}

export async function POST(request: Request) {
  const corsResponse = handleCorsPreflight(request)
  if (corsResponse) return corsResponse

  const rateLimitResponse = await postRateLimit(request)
  if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse)

  try {
    if (!stripe) {
      throw new ApiError(503, "Donations are not configured", "SERVICE_UNAVAILABLE")
    }

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

    const { amount, currency = "USD", recipientType, recipientId } = body

    const amountNum = typeof amount === "number" ? amount : parseFloat(amount)
    if (isNaN(amountNum) || amountNum < 1) {
      throw new ApiError(400, "Amount must be at least 1", ErrorCodes.VALIDATION_ERROR)
    }

    const validTypes = ["platform", "group", "creator"]
    if (!recipientType || !validTypes.includes(recipientType)) {
      throw new ApiError(400, "Invalid recipient type", ErrorCodes.VALIDATION_ERROR)
    }

    if (recipientType !== "platform" && !recipientId) {
      throw new ApiError(400, "Recipient ID required for group or creator", ErrorCodes.VALIDATION_ERROR)
    }

    const amountCents = Math.round(amountNum * 100)

    const donation = await prisma.donation.create({
      data: {
        amount: amountCents / 100,
        currency: String(currency).toUpperCase().slice(0, 3),
        recipientType,
        recipientId: recipientType === "platform" ? null : String(recipientId),
        donorId: session.user.id,
        status: "pending",
      },
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: (currency || "usd").toLowerCase().slice(0, 3),
      automatic_payment_methods: { enabled: true },
      metadata: {
        donationId: donation.id,
        donorId: session.user.id,
        recipientType,
        recipientId: recipientId || "platform",
      },
    })

    await prisma.donation.update({
      where: { id: donation.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    })

    const response = NextResponse.json({
      donationId: donation.id,
      clientSecret: paymentIntent.client_secret,
    })
    return addSecurityHeaders(response)
  } catch (error) {
    return addSecurityHeaders(createErrorResponse(error, "Failed to create donation"))
  }
}
