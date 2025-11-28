export async function POST(req: Request) {
  try {
    const api = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!api) {
      return new Response("API base URL missing", { status: 500 });
    }

    const body = await req.json();

    const res = await fetch(`${api}/create_event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Backend create_event error:", text);
      return new Response(text, { status: res.status });
    }

    return new Response(await res.text(), { status: 200 });

  } catch (err: any) {
    console.error("Error in /api/create-event:", err);
    return new Response("Server error", { status: 500 });
  }
}
