import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    passwordSet: !!process.env.MYSQL_PASSWORD
  });
}
