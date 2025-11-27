export async function GET(request: Request, { params }: any) {
  const api = process.env.NEXT_PUBLIC_API_BASE_URL;
  const res = await fetch(`${api}/event_abv_ranges?event_id=${params.eventId}`);

  return new Response(await res.text(), { status: res.status });
}
