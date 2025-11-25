import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  req: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;

  console.log("➡️ GET abv-options for event", eventId);

  const rows = await query(
    `
    SELECT ar.id, ar.label
    FROM event_abv_ranges ear
    JOIN abv_ranges ar ON ear.abv_range_id = ar.id
    WHERE ear.event_id = ?
    ORDER BY ar.id;
    `,
    [Number(eventId)]
  );

  return NextResponse.json(rows);
}
