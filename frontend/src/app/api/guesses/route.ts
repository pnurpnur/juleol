import { NextResponse } from "next/server";

const GO_API = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function POST(req: Request) {
  const body = await req.json();
  console.log("➡️ Forward guess to Go backend:", body);

  const res = await fetch(`${GO_API}/submit_guess`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("🔴 Go backend error:", text);
    return NextResponse.json({ error: text }, { status: res.status });
  }

  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ raw: text });
  }
}
