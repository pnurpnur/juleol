export async function GET(_req: Request, ctx: { params: Promise<{ eventId: string }> }) {
  const params = await ctx.params;
  const api = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!api) {
    console.error("Missing NEXT_PUBLIC_API_BASE_URL");
    return new Response("Missing API base URL", { status: 500 });
  }

  const eventId = params.eventId;

  const res = await fetch(`${api}/event_beer_options?event_id=${eventId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Backend /event_beer_options failed:", text);
    return new Response(text, { status: res.status });
  }

  const data = await res.json();
  return Response.json(data);
}
