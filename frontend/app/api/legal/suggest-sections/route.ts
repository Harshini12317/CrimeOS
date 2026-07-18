import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000/api";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("crimeos_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.case_description) {
    return NextResponse.json({ error: "case_description is required." }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_API_URL}/legal/suggest-sections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      { error: `Could not reach backend at ${BACKEND_API_URL}. Is it running?` },
      { status: 502 }
    );
  }

  const data = await backendRes.json().catch(() => ({}));
  if (!backendRes.ok) {
    return NextResponse.json({ error: data.error ?? data.detail ?? "Request failed." }, { status: backendRes.status });
  }
  return NextResponse.json(data);
}