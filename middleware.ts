import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth(function middleware(req) {
  if (!req.auth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/invoices/:path*',
    '/clients/:path*',
    '/analytics/:path*',
    '/api/((?!auth|register).*)',
  ],
}
