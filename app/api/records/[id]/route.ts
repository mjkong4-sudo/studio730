import { NextResponse } from "next/server"
import { getServerSessionHelper } from "@/lib/get-session"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const record = await prisma.record.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
            firstName: true,
            lastName: true,
            city: true,
            country: true,
          }
        }
      }
    })

    if (!record) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error("Error fetching record:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

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

    // Check if record exists and user owns it
    const existingRecord = await prisma.record.findUnique({
      where: { id: params.id }
    })

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      )
    }

    if (existingRecord.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden - You can only edit your own records" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { date, city, content, gathering } = body

    if (!date || !content || !gathering) {
      return NextResponse.json(
        { error: "Date, gathering, and content are required" },
        { status: 400 }
      )
    }

    const record = await prisma.record.update({
      where: { id: params.id },
      data: {
        date: new Date(date),
        city: city?.trim() || "", // Keep city field for backward compatibility
        content: content.trim(),
        gathering: typeof gathering === "string" ? gathering.trim() : gathering,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
            firstName: true,
            lastName: true,
            city: true,
            country: true,
          }
        }
      }
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error("Error updating record:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

