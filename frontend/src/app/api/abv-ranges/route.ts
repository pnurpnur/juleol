import { callBackend } from "@/lib/authz";

// GET  /api/abv-ranges — full ABV-range catalog
// POST /api/abv-ranges — create an ABV range, optionally attaching to an event
export async function GET() {
  const res = await callBackend("/abv_ranges", { method: "GET" });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const res = await callBackend("/abv_ranges", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
