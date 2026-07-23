import { callBackend, currentIsAdmin } from "@/lib/authz";

export async function POST(req: Request) {
  try {
    if (!(await currentIsAdmin())) {
      return new Response("Admin only", { status: 403 });
    }

    const body = await req.json();

    const res = await callBackend("/create_event", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Backend create_event error:", text);
      return new Response(text, { status: res.status });
    }

    return new Response(await res.text(), { status: 200 });
  } catch (err: any) {
    console.error("Error in /api/create-event:", err);
    return new Response("Server error", { status: 500 });
  }
}
