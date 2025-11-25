import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const rows = await query(
    "SELECT id, label FROM beer_types ORDER BY label"
  );

  return NextResponse.json(rows);
}
