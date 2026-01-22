import { NextResponse } from "next/server"
import { getServerSessionHelper } from "@/lib/get-session"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSessionHelper()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if comment exists and user owns it
    const existingComment = await prisma.comment.findUnique({
      where: { id: params.id }
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      )
    }

    if (existingComment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden - You can only edit your own comments" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )
    }

    const comment = await prisma.comment.update({
      where: { id: params.id },
      data: {
        content: content.trim(),
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

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Error updating comment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

