import { callBackend } from "@/lib/authz";

export async function POST(req: Request, ctx: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await ctx.params;
  const body = await req.json();

  const res = await callBackend(`/event_abv_ranges?event_id=${eventId}`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const text = await res.text();
  return new Response(text, { status: res.status });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await ctx.params;
  const body = await req.json();

  const res = await callBackend(`/event_abv_ranges?event_id=${eventId}`, {
    method: "DELETE",
    body: JSON.stringify(body),
  });

  const text = await res.text();
  return new Response(text, { status: res.status });
}

export async function GET(_req: Request, ctx: { params: Promise<{ eventId: string }> }) {
  const params = await ctx.params;
  const api = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!api) {
    return new Response("Missing API base URL", { status: 500 });
  }

  const eventId = params.eventId;

  const res = await fetch(`${api}/event_abv_ranges?event_id=${eventId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Backend /event_abv_ranges failed:", text);
    return new Response(text, { status: res.status });
  }

  return Response.json(await res.json());
}
