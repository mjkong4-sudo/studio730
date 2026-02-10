import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import { verifyPassword } from "./password"
import type { User } from "next-auth"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email) {
            console.error("No email provided")
            throw new Error("Email is required")
          }

          if (!credentials?.password) {
            console.error("No password provided")
            throw new Error("Password is required")
          }

          const email = credentials.email.toLowerCase().trim()
          const password = credentials.password

          console.log("Attempting to authorize:", email)

          // Find user
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              password: true,
              nickname: true,
              blocked: true,
            }
          })

          if (!user) {
            console.error("User not found:", email)
            throw new Error("Invalid email or password")
          }

          // Check if user is blocked
          if (user.blocked) {
            console.error("User is blocked:", email)
            throw new Error("Your account has been blocked. Please contact support.")
          }

          // Verify password
          if (!user.password) {
            console.error("User has no password set:", email)
            throw new Error("Please set up a password for your account. Use the signup page.")
          }

          const isValidPassword = await verifyPassword(password, user.password)
          if (!isValidPassword) {
            console.error("Invalid password for user:", email)
            throw new Error("Invalid email or password")
          }

          console.log("User authenticated successfully:", user.id)

          const authUser: User = {
            id: user.id,
            email: user.email,
            nickname: user.nickname || user.email,
            hasNickname: !!user.nickname,
          }
          return authUser
        } catch (error) {
          console.error("Error in authorize:", error)
          // Re-throw the error so NextAuth can provide a better error message
          if (error instanceof Error) {
            throw error
          }
          throw new Error("Authentication failed. Please try again.")
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
