import { NextResponse } from "next/server";
import { callBackend } from "@/lib/authz";

const API = process.env.NEXT_PUBLIC_API_BASE_URL;

// Pass the upstream body through verbatim. The backend returns JSON on success
// and plain-text on error (http.Error), so never assume JSON here.
function passthrough(text: string, status: number) {
  // 204/205/304 must have a null body, or the Response constructor throws.
  const nullBody = status === 204 || status === 205 || status === 304;
  return new Response(nullBody ? null : text, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req: Request, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;
  const res = await fetch(`${API}/event_beers?event_id=${eventId}`, { method: "GET" });
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
  return passthrough(await res.text(), res.status);
}

export async function PUT(req: Request, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;
  const body = await req.json();
  const res = await callBackend(`/event_beers?event_id=${eventId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return passthrough(await res.text(), res.status);
}

export async function PATCH(req: Request, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;
  const body = await req.json();
  const res = await callBackend(`/event_beers?event_id=${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return passthrough(await res.text(), res.status);
}

export async function DELETE(req: Request, context: { params: Promise<{ eventId: string }> }) {
  await context.params;
  const body = await req.json();
  const res = await callBackend(`/delete_event_beer`, {
    method: "DELETE",
    body: JSON.stringify(body),
  });
  return passthrough(await res.text(), res.status);
}
