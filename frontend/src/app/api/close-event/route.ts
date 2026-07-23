import { callBackend } from "@/lib/authz";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await callBackend("/close_event", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Backend close_event error:", text);
      return new Response(text, { status: res.status });
    }

    return new Response(await res.text(), { status: 200 });
  } catch (err: any) {
    console.error("Error in /api/close-event:", err);
    return new Response("Server error", { status: 500 });
  }
}
