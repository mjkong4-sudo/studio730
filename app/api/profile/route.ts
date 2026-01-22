import { NextResponse } from "next/server"
import { getServerSessionHelper } from "@/lib/get-session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSessionHelper()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
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
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSessionHelper()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nickname, firstName, lastName, city, country, bio } = body

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        nickname,
        firstName,
        lastName,
        city,
        country,
        bio,
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

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

