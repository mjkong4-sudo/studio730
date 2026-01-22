import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null
        }

        const email = credentials.email.toLowerCase().trim()

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email }
        })

        if (!user) {
          // Create new user automatically
          user = await prisma.user.create({
            data: {
              email,
              emailVerified: new Date(), // Mark as verified since we're skipping verification
            }
          })
        }

        return {
          id: user.id,
          email: user.email,
          nickname: user.nickname || user.email,
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
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      
      // Always fetch latest nickname from DB (on initial login or when session is updated)
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { nickname: true }
        })
        token.nickname = dbUser?.nickname || token.email
        token.hasNickname = !!dbUser?.nickname
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.nickname = token.nickname as string
        session.user.hasNickname = token.hasNickname as boolean
      }
      return session
    }
  }
}
