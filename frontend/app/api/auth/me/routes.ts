import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("crimeos_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let flaskRes: Response;
  try {
    flaskRes = await fetch(`${BACKEND_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return NextResponse.json(
      { error: `Could not reach backend at ${BACKEND_API_URL}. Is it running?` },
      { status: 502 }
    );
  }

  if (!flaskRes.ok) {
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  }

  const user = await flaskRes.json();
  return NextResponse.json({ user });
}