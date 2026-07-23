import { callBackend } from "@/lib/authz";

// GET /api/users — list of all users (admin only; enforced by backend).
export async function GET() {
  const res = await callBackend("/users", { method: "GET" });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
