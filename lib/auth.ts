import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import type { User } from "next-auth"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email) {
            console.error("No email provided")
            return null
          }

          const email = credentials.email.toLowerCase().trim()
          console.log("Attempting to authorize:", email)

          // Find or create user
          let user = await prisma.user.findUnique({
            where: { email }
          })

          if (!user) {
            console.log("User not found, creating new user:", email)
            // Create new user automatically
            user = await prisma.user.create({
              data: {
                email,
                emailVerified: new Date(), // Mark as verified since we're skipping verification
              }
            })
            console.log("User created:", user.id)
          } else {
            console.log("User found:", user.id)
          }

          const authUser: User = {
            id: user.id,
            email: user.email,
            nickname: user.nickname || user.email,
            hasNickname: !!user.nickname,
          }
          return authUser
        } catch (error) {
          console.error("Error in authorize:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      try {
        if (user) {
          token.id = user.id
          token.email = user.email
        }
        
        // Always fetch latest user data from DB (on initial login or when session is updated)
        if (token.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { nickname: true, role: true, blocked: true }
          })
          token.nickname = dbUser?.nickname || token.email
          token.hasNickname = !!dbUser?.nickname
          token.role = dbUser?.role || "user"
          token.blocked = dbUser?.blocked || false
        }
        
        return token
      } catch (error) {
        console.error("Error in jwt callback:", error)
        return token
      }
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.nickname = token.nickname as string
        session.user.hasNickname = token.hasNickname as boolean
        session.user.role = token.role as string
        session.user.blocked = token.blocked as boolean
      }
      return session
    }
  }
}
