import { getServerSessionHelper } from "@/lib/get-session"
import { ApiError, ErrorCodes } from "@/lib/api-error"
import { prisma } from "@/lib/prisma"

/**
 * Check if user is admin
 */
export async function requireAdmin() {
  const session = await getServerSessionHelper()
  
  if (!session?.user?.id) {
    throw new ApiError(401, "Unauthorized", ErrorCodes.UNAUTHORIZED)
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, blocked: true }
  })

  if (!user) {
    throw new ApiError(404, "User not found", ErrorCodes.NOT_FOUND)
  }

  if (user.blocked) {
    throw new ApiError(403, "Your account has been blocked", ErrorCodes.FORBIDDEN)
  }

  if (user.role !== "admin" && user.role !== "moderator") {
    throw new ApiError(403, "Admin access required", ErrorCodes.FORBIDDEN)
  }

  return { session, user }
}

/**
 * Check if user is admin or moderator
 */
export async function requireModerator() {
  return requireAdmin() // Same check for now
}
