import { callBackend } from "@/lib/authz";

function pass(text: string, status: number) {
  return new Response(text, { status, headers: { "Content-Type": "application/json" } });
}

export async function GET() {
  const res = await callBackend("/breweries", { method: "GET" });
  return pass(await res.text(), res.status);
}

export async function POST(req: Request) {
  const body = await req.json();
  const res = await callBackend("/breweries", { method: "POST", body: JSON.stringify(body) });
  return pass(await res.text(), res.status);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const res = await callBackend("/breweries", { method: "PUT", body: JSON.stringify(body) });
  return pass(await res.text(), res.status);
}
