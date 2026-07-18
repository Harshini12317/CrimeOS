import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Add every path prefix that requires login here.
const PROTECTED_PREFIXES = ["/dashboard", "/legal-requests"];

// Paths that require a *specific* role, beyond just being logged in.
const ROLE_ROUTES: Record<string, string[]> = {
  "/legal-requests": ["LEGAL_ADVISOR"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("crimeos_token")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verifies the signature here in the edge runtime — this must be the
    // SAME secret as Flask's JWT_SECRET_KEY (env var below).
    const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string | undefined;

    const requiredRoles = Object.entries(ROLE_ROUTES).find(([prefix]) =>
      pathname.startsWith(prefix)
    )?.[1];

    if (requiredRoles && (!role || !requiredRoles.includes(role))) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  } catch {
    // Expired or tampered token — clear it and send back to login.
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("crimeos_token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/legal-requests/:path*"],
};