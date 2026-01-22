import { authOptions } from "./auth"
import { getServerSession } from "next-auth/next"

export async function getServerSessionHelper() {
  try {
    return await getServerSession(authOptions)
  } catch (error) {
    return null
  }
}

