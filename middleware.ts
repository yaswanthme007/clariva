import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET

export async function middleware(req: NextRequest) {
  // NextAuth v5 uses "authjs.session-token" (not "next-auth.session-token").
  // In production (HTTPS) it gets the __Secure- prefix.
  // The salt for JWT decode must equal the cookie name.
  const isSecure = req.url.startsWith('https://')
  const cookieName = isSecure
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token'

  const token = await getToken({ req, secret, cookieName, salt: cookieName })

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  // Only protect dashboard routes.
  // /login, /register, /, /api/auth/*, /api/register, /api/health
  // are all outside this matcher — they never hit middleware.
  matcher: ['/dashboard/:path*'],
}
