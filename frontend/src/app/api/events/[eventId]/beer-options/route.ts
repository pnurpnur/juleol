import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  req: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;

  console.log("➡️ GET beer-options for event", eventId);

  const rows = await query(
    `
    SELECT bo.id, bo.name
    FROM event_beer_options ebo
    JOIN beer_options bo ON ebo.beer_option_id = bo.id
    WHERE ebo.event_id = ?
    ORDER BY bo.name;
    `,
    [Number(eventId)]
  );

  return NextResponse.json(rows);
}
