export async function GET(request: Request) {
  const api = process.env.NEXT_PUBLIC_API_BASE_URL;

  const url = new URL(request.url);
  const qs = url.searchParams.toString(); // event_id, beer_id, user_id

  const res = await fetch(`${api}/get_guess?${qs}`);

  return new Response(await res.text(), { status: res.status });
}

export async function POST(request: Request) {
  const api = process.env.NEXT_PUBLIC_API_BASE_URL;
  const body = await request.text();

  const res = await fetch(`${api}/submit_guess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  return new Response(await res.text(), { status: res.status });
}
