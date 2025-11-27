export async function GET() {
  const api = process.env.NEXT_PUBLIC_API_BASE_URL;

  const res = await fetch(`${api}/events`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    return new Response("Upstream API error", { status: res.status });
  }

  const data = await res.json();
  return Response.json(data);
}
