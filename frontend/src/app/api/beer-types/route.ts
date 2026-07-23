import { callBackend } from "@/lib/authz";

// POST /api/beer-types — create a new beer type (admin only; enforced by backend)
export async function POST(req: Request) {
  const body = await req.json();
  const res = await callBackend("/beer_types", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
