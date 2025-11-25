import { NextResponse } from "next/server";

const GO_API = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function POST(req: Request) {
  const body = await req.json();
  console.log("➡️ Closing event:", body);

  const res = await fetch(`${GO_API}/close_event`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
  });

  return NextResponse.json(await res.json());
}
