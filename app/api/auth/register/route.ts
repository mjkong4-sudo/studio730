// This route is no longer needed - users are created automatically via email verification
// Keeping it for backwards compatibility but it just redirects to login
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  return NextResponse.json(
    { 
      message: "Please use the email verification flow. Visit /login to sign in.",
      redirect: "/login"
    },
    { status: 200 }
  )
}

