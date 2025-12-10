import { auth } from "@/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id");

  if (!eventId) {
    return new Response("Missing event_id", { status: 400 });
  }

  const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  if (!API) {
    return new Response("API_BASE_URL not configured", { status: 500 });
  }

  try {
    // call the backend stats endpoint - adjust path if needed
    const res = await fetch(`${API}/event_stats?event_id=${eventId}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return new Response(`Backend error: ${res.status}`, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    console.error("EventStats GET error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id");

  if (!eventId) {
    return new Response("Missing event_id", { status: 400 });
  }

  const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  if (!API) {
    return new Response("API_BASE_URL not configured", { status: 500 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Only allow certain keys to be forwarded to update_event
  const allowed: Record<string, any> = {};
  if (typeof body.is_open === "boolean") allowed.is_open = body.is_open;

  if (Object.keys(allowed).length === 0) {
    return new Response("No valid fields to update", { status: 400 });
  }

  try {
    const res = await fetch(`${API}/update_event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: Number(eventId),
        ...allowed,
      }),
    });

    const text = await res.text();
    // try to parse JSON, but return raw text on parse error
    try {
      const json = JSON.parse(text);
      return Response.json(json, { status: res.status });
    } catch {
      return new Response(text, { status: res.status });
    }
  } catch (err) {
    console.error("EventStats POST error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
