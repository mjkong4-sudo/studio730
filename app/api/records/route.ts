import { NextResponse } from "next/server"
import { getServerSessionHelper } from "@/lib/get-session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const records = await prisma.record.findMany({
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
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                nickname: true,
              }
            }
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      },
      orderBy: {
        date: "desc"
      }
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error("Error fetching records:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSessionHelper()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { date, city, content, gathering } = body
    console.log("Received form data:", { date, city, content: content?.substring(0, 50), gathering })

    if (!date || !content) {
      return NextResponse.json(
        { error: "Date and content are required" },
        { status: 400 }
      )
    }

    if (!gathering || (typeof gathering === "string" && gathering.trim() === "")) {
      return NextResponse.json(
        { error: "Please select a gathering" },
        { status: 400 }
      )
    }

    try {
      const record = await prisma.record.create({
        data: {
          date: new Date(date),
          city: city?.trim() || "", // Keep city field for backward compatibility, but make it optional
          content: content.trim(),
          gathering: typeof gathering === "string" ? gathering.trim() : gathering,
          userId: session.user.id,
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

      return NextResponse.json(record, { status: 201 })
    } catch (dbError: any) {
      console.error("Database error creating record:", dbError)
      const dbErrorMessage = dbError?.message || dbError?.toString() || "Database error"
      console.error("Database error details:", {
        code: dbError?.code,
        meta: dbError?.meta,
        message: dbErrorMessage
      })
      return NextResponse.json(
        { error: `Failed to save record: ${dbErrorMessage}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error in POST handler:", error)
    const errorMessage = error?.message || error?.toString() || "Internal server error"
    console.error("Error details:", {
      message: errorMessage,
      stack: error?.stack,
      name: error?.name
    })
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

