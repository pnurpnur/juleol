import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  req: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;

  console.log("➡️ GET beers for event", eventId);

  const rows = await query(
    `
    SELECT 
      b.id,
      bo.name AS beer_name,
      ar.label AS abv_range,
      bt.label AS beer_type
    FROM beers b
    JOIN beer_options bo ON b.beer_option_id = bo.id
    JOIN abv_ranges ar ON b.abv_range_id = ar.id
    JOIN beer_types bt ON b.beer_type_id = bt.id
    WHERE b.event_id = ?
    ORDER BY b.id;
    `,
    [Number(eventId)]
  );

  return NextResponse.json(rows);
}
