export async function GET(
  req: Request,
  ctx: { params: Promise<{ eventId: string; beerId: string }> }
) {
  const params = await ctx.params;

  const api = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!api) return new Response("Missing API base URL", { status: 500 });

  const userId = new URL(req.url).searchParams.get("user_id");
  if (!userId) return new Response("Missing user_id", { status: 400 });

  const res = await fetch(
    `${api}/get_rating?event_id=${params.eventId}&beer_id=${params.beerId}&user_id=${userId}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Backend /get_rating failed:", text);
    return new Response(text, { status: res.status });
  }

  return Response.json(await res.json());
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ eventId: string; beerId: string }> }
) {
  const params = await ctx.params;

  const api = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!api) return new Response("Missing API base URL", { status: 500 });

  const body = await req.json();

  const payload = {
    event_id: Number(params.eventId),
    beer_id: Number(params.beerId),
    user_id: body.user_id,
    rating: body.rating,
    untappd_score: body.untappd_score || null,
  };

  const res = await fetch(`${api}/submit_rating`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Backend submit_rating failed:", text);
    return new Response(text, { status: res.status });
  }

  return Response.json(await res.json());
}
