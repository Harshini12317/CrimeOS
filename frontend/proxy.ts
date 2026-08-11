import {
  NextRequest,
  NextResponse,
} from "next/server";

/*
|--------------------------------------------------------------------------
| FRONTEND PROXY
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Authentication is handled by the FastAPI backend.
|
| The FastAPI backend owns:
|
|   - JWT
|   - crimeos_token
|   - get_current_user()
|   - require_role()
|
| The Next.js frontend is deployed on a different domain.
|
| Therefore this proxy MUST NOT try to read:
|
|   request.cookies.get("crimeos_token")
|
| because that cookie belongs to the backend domain.
|
|--------------------------------------------------------------------------
*/

export function proxy(
  request: NextRequest
) {
  const pathname =
    request.nextUrl.pathname;

  console.log(
    "🔥 PROXY:",
    pathname
  );

  /*
   * Allow the request to continue.
   *
   * Actual authentication and authorization
   * happens through the FastAPI backend.
   */

  return NextResponse.next();
}

/*
|--------------------------------------------------------------------------
| ROUTES INTERCEPTED BY PROXY
|--------------------------------------------------------------------------
|
| We keep the matcher because these are the
| application areas we may later protect at
| the Next.js level.
|
| For the current Option 1 architecture,
| the proxy simply allows them through.
|
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