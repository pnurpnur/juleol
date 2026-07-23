import { NextResponse } from "next/server";
import { callBackend } from "@/lib/authz";

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

  const res = await callBackend(`/event_beers?event_id=${eventId}`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req: Request, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;
  const body = await req.json();

  const res = await callBackend(`/event_beers?event_id=${eventId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: Request, context: { params: Promise<{ eventId: string }> }) {
  await context.params;
  const body = await req.json();

  const res = await callBackend(`/delete_event_beer`, {
    method: "DELETE",
    body: JSON.stringify(body),
  });

  return NextResponse.json({}, { status: res.status });
}
