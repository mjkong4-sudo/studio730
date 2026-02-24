import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: Request) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid signature"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const donationId = paymentIntent.metadata?.donationId

    if (donationId) {
      await prisma.donation.update({
        where: { id: donationId },
        data: { status: "completed" },
      })
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const donationId = paymentIntent.metadata?.donationId

    if (donationId) {
      await prisma.donation.update({
        where: { id: donationId },
        data: { status: "failed" },
      })
    }
  }

  return NextResponse.json({ received: true })
}
