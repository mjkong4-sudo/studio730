import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      nickname: string
      hasNickname: boolean
    }
  }

  interface User {
    id: string
    email: string
    nickname: string
    hasNickname: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    nickname: string
    hasNickname: boolean
  }
}

