import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

/*
|--------------------------------------------------------------------------
| ROLE ROUTES
|--------------------------------------------------------------------------
*/

const ROLE_ROUTES: Record<string, string[]> = {
  // ============================================================
  // DASHBOARDS
  // ============================================================

  "/dashboard/io": ["IO"],
  "/dashboard/sho": ["SHO"],
  "/dashboard/legal-advisor": ["LEGAL_ADVISOR"],

  // ============================================================
  // COMPLAINTS
  // ============================================================

  // Complaint registration
  "/complaints/register": ["SHO"],

  // Case assignment
  "/complaints/assign": ["SHO"],

  // General complaint pages
  "/complaints": ["SHO"],

  // ============================================================
  // CASES
  // ============================================================

  "/cases": ["IO"],

  // ============================================================
  // IO MODULES
  // ============================================================

  "/evidence": ["IO"],
  "/fir": ["IO"],
  "/case-diary": ["IO"],
};


/*
|--------------------------------------------------------------------------
| ROLE HOME
|--------------------------------------------------------------------------
*/

const ROLE_HOME: Record<string, string> = {
  IO: "/dashboard/io",
  SHO: "/dashboard/sho",
  LEGAL_ADVISOR: "/dashboard/legal-advisor",
};


/*
|--------------------------------------------------------------------------
| PROXY
|--------------------------------------------------------------------------
*/

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log("🔥 PROXY:", pathname);


  // ============================================================
  // PUBLIC ROUTES
  // ============================================================

  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }


  // ============================================================
  // GET JWT TOKEN
  // ============================================================

  const token = request.cookies.get("crimeos_token")?.value;

  if (!token) {
    console.log("❌ NO TOKEN");

    const loginUrl = new URL(
      "/login",
      request.url
    );

    loginUrl.searchParams.set(
      "from",
      pathname
    );

    return NextResponse.redirect(loginUrl);
  }


  // ============================================================
  // VERIFY JWT
  // ============================================================

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET_KEY
    );

    const { payload } = await jwtVerify(
      token,
      secret
    );

    const role =
      payload.role as string | undefined;

    console.log("ROLE:", role);
    console.log("PATH:", pathname);


    // ============================================================
    // ROLE MISSING
    // ============================================================

    if (!role) {
      console.log("❌ JWT DOES NOT CONTAIN ROLE");

      return NextResponse.redirect(
        new URL(
          "/unauthorized",
          request.url
        )
      );
    }


    // ============================================================
    // /dashboard
    //
    // Redirect to role-specific dashboard
    // ============================================================

    if (
      pathname === "/dashboard" ||
      pathname === "/dashboard/"
    ) {
      const home = ROLE_HOME[role];

      return NextResponse.redirect(
        new URL(
          home ?? "/unauthorized",
          request.url
        )
      );
    }


    // ============================================================
    // SPECIAL ROUTE:
    //
    // /complaints/:complaintId/legal_sections
    //
    // Allowed:
    //      SHO
    //      IO
    //
    // Example:
    //
    // /complaints/f07a1e0d-6487-4892-aba4-49686d1cb537/legal_sections
    // ============================================================

    const legalSectionsPattern =
      /^\/complaints\/[^/]+\/legal_sections(?:\/.*)?$/;

    if (legalSectionsPattern.test(pathname)) {
      console.log(
        "LEGAL SECTIONS ROUTE"
      );

      if (
        !["SHO", "IO"].includes(role)
      ) {
        console.log(
          "❌ ACCESS DENIED - LEGAL SECTIONS"
        );

        return NextResponse.redirect(
          new URL(
            "/unauthorized",
            request.url
          )
        );
      }

      console.log(
        "✅ ACCESS ALLOWED - LEGAL SECTIONS"
      );

      return NextResponse.next();
    }


    // ============================================================
    // FIND MATCHING ROLE ROUTE
    //
    // We:
    //
    // 1. Require exact match OR
    // 2. pathname starts with prefix + "/"
    //
    // This prevents accidental partial matches.
    //
    // Then we choose the LONGEST matching route.
    //
    // Example:
    //
    // /complaints/register
    //
    // matches:
    //
    // /complaints
    // /complaints/register
    //
    // But /complaints/register wins because it is more specific.
    // ============================================================

    const matchingRoutes = Object.entries(
      ROLE_ROUTES
    )
      .filter(([prefix]) => {
        return (
          pathname === prefix ||
          pathname.startsWith(
            `${prefix}/`
          )
        );
      })
      .sort(
        ([a], [b]) =>
          b.length - a.length
      );


    // ============================================================
    // GET REQUIRED ROLES
    // ============================================================

    const matchedRoute =
      matchingRoutes.length > 0
        ? matchingRoutes[0]
        : null;

    const requiredRoles =
      matchedRoute
        ? matchedRoute[1]
        : undefined;


    console.log(
      "MATCHED ROUTE:",
      matchedRoute
        ? matchedRoute[0]
        : "NONE"
    );

    console.log(
      "REQUIRED ROLES:",
      requiredRoles
    );


    // ============================================================
    // CHECK ROLE
    // ============================================================

    if (
      requiredRoles &&
      !requiredRoles.includes(role)
    ) {
      console.log(
        "❌ ACCESS DENIED"
      );

      return NextResponse.redirect(
        new URL(
          "/unauthorized",
          request.url
        )
      );
    }


    // ============================================================
    // ROUTE NOT EXPLICITLY PROTECTED
    //
    // Since this proxy is only matched for the protected
    // prefixes in config, allowing it here is okay.
    // ============================================================

    console.log(
      "✅ ACCESS ALLOWED"
    );

    return NextResponse.next();

  } catch (error) {
    console.log(
      "❌ JWT ERROR:",
      error
    );

    const response =
      NextResponse.redirect(
        new URL(
          "/login",
          request.url
        )
      );

    response.cookies.delete(
      "crimeos_token"
    );

    return response;
  }
}


/*
|--------------------------------------------------------------------------
| PROTECTED PATHS
|--------------------------------------------------------------------------
*/

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