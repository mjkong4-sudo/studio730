import { NextResponse } from "next/server"
import { getServerSessionHelper } from "@/lib/get-session"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSessionHelper()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { recordId, content } = body

    if (!recordId || !content) {
      return NextResponse.json(
        { error: "Record ID and content are required" },
        { status: 400 }
      )
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        recordId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          }
        }
      }
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

