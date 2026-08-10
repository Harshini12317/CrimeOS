import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ROLE_ROUTES: Record<string, string[]> = {
  "/dashboard/io": ["IO"],
  "/dashboard/sho": ["SHO"],
  "/dashboard/legal-advisor": ["LEGAL_ADVISOR"],

  "/complaints/register": ["SHO"],
  "/complaints": ["SHO"],
  "/complaints/assign": ["SHO"],

  "/cases": ["IO"],
  "/evidence": ["IO"],
  "/fir": ["IO"],
  "/case-diary": ["IO"],
};

const ROLE_HOME: Record<string, string> = {
  IO: "/dashboard/io",
  SHO: "/dashboard/sho",
  LEGAL_ADVISOR: "/dashboard/legal-advisor",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log("🔥 PROXY:", pathname);

  // NEVER protect these routes
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Get JWT token
  const token = request.cookies.get("crimeos_token")?.value;

  // User isn't logged in
  if (!token) {
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set("from", pathname);

    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET_KEY
    );

    const { payload } = await jwtVerify(token, secret);

    const role = payload.role as string | undefined;

    console.log("ROLE:", role);
    console.log("PATH:", pathname);

    // JWT doesn't contain role
    if (!role) {
      return NextResponse.redirect(
        new URL("/unauthorized", request.url)
      );
    }

    // /dashboard → role-specific dashboard
    if (
      pathname === "/dashboard" ||
      pathname === "/dashboard/"
    ) {
      const home = ROLE_HOME[role];

      return NextResponse.redirect(
        new URL(home ?? "/unauthorized", request.url)
      );
    }

    // Find required role for this route
    const requiredRoles = Object.entries(ROLE_ROUTES)
      .sort(([a], [b]) => b.length - a.length)
      .find(([prefix]) => pathname.startsWith(prefix))
      ?.[1];

    // User has no permission for this route
    if (
      requiredRoles &&
      !requiredRoles.includes(role)
    ) {
      console.log("❌ ACCESS DENIED");

      return NextResponse.redirect(
        new URL("/unauthorized", request.url)
      );
    }

    console.log("✅ ACCESS ALLOWED");

    return NextResponse.next();
  } catch (error) {
    console.log("❌ JWT ERROR:", error);

    const response = NextResponse.redirect(
      new URL("/login", request.url)
    );

    response.cookies.delete("crimeos_token");

    return response;
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/complaints/:path*",
    "/cases/:path*",
    "/evidence/:path*",
    "/fir/:path*",
    "/case-diary/:path*",
  ],
};