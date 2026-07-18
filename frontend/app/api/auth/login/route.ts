import { NextRequest, NextResponse } from "next/server";

// uvicorn's default port is 8000 — match whatever port FastAPI runs on.
const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000/api";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    return NextResponse.json(
      { error: data.error ?? data.detail ?? "Login failed." },
      { status: backendRes.status }
    );
  }

  const response = NextResponse.json({ user: data.user });
  response.cookies.set("crimeos_token", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}