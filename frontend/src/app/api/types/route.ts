export async function GET() {
  const api = process.env.NEXT_PUBLIC_API_BASE_URL;
  const res = await fetch(`${api}/types`);

  return new Response(await res.text(), { status: res.status });
}
