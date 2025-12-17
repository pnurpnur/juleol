import { auth } from "@/auth";

export async function GET(request: Request) {
  // Krever innlogging
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Les query params
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id");

  if (!eventId) {
    return new Response("Missing event_id", { status: 400 });
  }

  // Backend API (Go-server)
  const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  if (!API) {
    return new Response("API_BASE_URL not configured", { status: 500 });
  }

  try {
    // Hent fasit-stats fra Go backend
    const backendRes = await fetch(
      `${API}/event_summary_feed?event_id=${eventId}`,
      {
        cache: "no-store",
      }
    );

    if (!backendRes.ok) {
      return new Response(
        `Backend error: ${backendRes.status}`,
        { status: backendRes.status }
      );
    }

    const json = await backendRes.json();
    return Response.json(json);

  } catch (err) {
    console.error("event_summary_feed error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
