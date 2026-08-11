import { NextRequest, NextResponse } from "next/server";

const BACKEND_ROOT = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("crimeos_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const incoming = await request.formData().catch(() => null);
  const file = incoming?.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const outgoing = new FormData();
  outgoing.append("file", file, file instanceof File ? file.name : "upload.pdf");

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_ROOT}/api/v1/pdf/upload/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: outgoing,
    });
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