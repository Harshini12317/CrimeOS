import { NextRequest, NextResponse } from "next/server";

const BACKEND_ROOT = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "http://localhost:8000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ complaintId: string }> }
) {
  const { complaintId } = await params;

  const token = request.cookies.get("crimeos_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  let backendRes: Response;
  try {
    backendRes = await fetch(
      `${BACKEND_ROOT}/api/complaints/${complaintId}/legal-sections/analyze`,
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
    return NextResponse.json(
      { error: data.detail ?? data.error ?? "Request failed." },
      { status: backendRes.status }
    );
  }
  return NextResponse.json(data);
}