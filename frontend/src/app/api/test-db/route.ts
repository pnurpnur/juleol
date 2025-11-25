import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const rows = await query("SELECT NOW() AS time");
  return NextResponse.json(rows);
}
