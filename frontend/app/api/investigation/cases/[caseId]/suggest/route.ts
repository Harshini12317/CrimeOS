import { NextRequest, NextResponse } from "next/server";

// Your `investigation` router has NO /api prefix (unlike /auth), so this
// strips a trailing /api off BACKEND_API_URL to get the bare backend root.
const BACKEND_ROOT = (process.env.BACKEND_API_URL ?? "http://localhost:8000/api").replace(/\/api\/?$/, "");

export async function POST(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const token = request.cookies.get("crimeos_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  let backendRes: Response;
  try {
    backendRes = await fetch(
      `${BACKEND_ROOT}/investigation/cases/${params.caseId}/suggest-investigation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );
  } catch {
    return NextResponse.json(
      { error: `Could not reach backend at ${BACKEND_ROOT}. Is it running?` },
      { status: 502 }
    );
  }

  const data = await backendRes.json().catch(() => ({}));
  if (!backendRes.ok) {
    return NextResponse.json({ error: data.detail ?? data.error ?? "Request failed." }, { status: backendRes.status });
  }
  return NextResponse.json(data);
}