import { callBackend } from "@/lib/authz";

// GET  /api/beer-options — full beer catalog (all events)
// POST /api/beer-options — create a beer, optionally attaching to an event
export async function GET() {
  const res = await callBackend("/beer_options", { method: "GET" });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const res = await callBackend("/beer_options", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

// PUT /api/beer-options — edit a beer {id, brewery_id, name, beer_type_id, abv, untappd_link, event_id?}
export async function PUT(req: Request) {
  const body = await req.json();
  const res = await callBackend("/beer_options", {
    method: "PUT",
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
