import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PREFIXES = ["/dashboard"];

// Each role's own folder is locked to that role. An SHO hitting
// /dashboard/io directly gets redirected to /unauthorized, not just
// hidden by the UI.
const ROLE_ROUTES: Record<string, string[]> = {
  "/dashboard/io": ["IO"],
  "/dashboard/sho": ["SHO"],
  "/dashboard/legal-advisor": ["LEGAL_ADVISOR"],
};

const ROLE_HOME: Record<string, string> = {
  IO: "/dashboard/io",
  SHO: "/dashboard/sho",
  LEGAL_ADVISOR: "/dashboard/legal-advisor",
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
    const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string | undefined;

    // Bare /dashboard -> send straight to that role's own dashboard.
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      const home = role ? ROLE_HOME[role] : undefined;
      return NextResponse.redirect(new URL(home ?? "/unauthorized", request.url));
    }

    const requiredRoles = Object.entries(ROLE_ROUTES).find(([prefix]) =>
      pathname.startsWith(prefix)
    )?.[1];

    if (requiredRoles && (!role || !requiredRoles.includes(role))) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("crimeos_token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};