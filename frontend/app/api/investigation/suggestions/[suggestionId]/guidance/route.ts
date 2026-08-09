import { NextRequest, NextResponse } from "next/server";

const BACKEND_ROOT = (process.env.BACKEND_API_URL ?? "http://localhost:8000/api").replace(/\/api\/?$/, "");

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ suggestionId: string }> }
) {
  const { suggestionId } = await params;
  const token = request.cookies.get("crimeos_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(
      `${BACKEND_ROOT}/investigation/suggestions/${suggestionId}/step-by-step-guidance`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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