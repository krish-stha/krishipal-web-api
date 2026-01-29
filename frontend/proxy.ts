// frontend/proxy.ts
import { NextRequest, NextResponse } from "next/server"

type CookieUser = {
  id: string
  email: string
  name: string
  role: "user" | "admin"
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only run checks for these routes
  const isAdminRoute = pathname.startsWith("/admin")
  const isUserRoute = pathname.startsWith("/user")

  if (!isAdminRoute && !isUserRoute) {
    return NextResponse.next()
  }

  // You are storing these cookies already
  const token = req.cookies.get("krishipal_token")?.value
  const userRaw = req.cookies.get("krishipal_user")?.value

  // Not logged in => block both /admin and /user
  if (!token || !userRaw) {
    const url = req.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  // Parse user cookie
  let user: CookieUser | null = null
  try {
    user = JSON.parse(userRaw) as CookieUser
  } catch {
    // broken cookie => kick out
    const url = req.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("next", pathname)
    const res = NextResponse.redirect(url)
    res.cookies.delete("krishipal_user")
    res.cookies.delete("krishipal_token")
    return res
  }

  // Admin route => must be admin
  if (isAdminRoute && user.role !== "admin") {
    const url = req.nextUrl.clone()
    url.pathname = "/" // or "/user/profile"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Run only on /admin and /user
export const config = {
  matcher: ["/admin/:path*", "/user/:path*"],
}
