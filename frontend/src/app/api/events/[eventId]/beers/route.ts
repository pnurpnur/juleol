import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function GET(req: Request, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;

  const res = await fetch(`${API}/event_beers?event_id=${eventId}`, {
    method: "GET",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: Request, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;
  const body = await req.json();

  const res = await fetch(`${API}/event_beers?event_id=${eventId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req: Request, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;
  const body = await req.json();

  const res = await fetch(`${API}/event_beers?event_id=${eventId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: Request, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;
  const body = await req.json();

  const res = await fetch(`${API}/delete_event_beer`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return NextResponse.json({}, { status: res.status });
}
