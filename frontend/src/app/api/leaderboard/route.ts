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
    const res = await fetch(`${API}/results?event_id=${eventId}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return new Response(`Backend error: ${res.status}`, {
        status: res.status,
      });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    console.error("Leaderboard error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}