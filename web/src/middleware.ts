import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, dashboardPath } from "@/lib/auth";
import { readToken } from "@/lib/jwt";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const claims = await readToken(req.cookies.get(AUTH_COOKIE)?.value);

  if (pathname.startsWith("/dashboard")) {
    if (!claims) {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", pathname + search);
      const res = NextResponse.redirect(url);
      res.cookies.delete(AUTH_COOKIE);
      return res;
    }
    const home = dashboardPath(claims.role);
    if (!pathname.startsWith(home)) return NextResponse.redirect(new URL(home, req.url));
    return NextResponse.next();
  }

  // Signed-in users don't need the auth pages
  if (claims && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL(dashboardPath(claims.role), req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
