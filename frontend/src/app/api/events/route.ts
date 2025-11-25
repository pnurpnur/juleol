import { query } from "@/lib/db";

export async function GET() {
  const events = await query("SELECT id, name FROM events ORDER BY created_at DESC");
  return Response.json(events);
}
