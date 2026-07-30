// app/api/events/[eventId]/route.ts
import { callBackend } from "@/lib/authz";

export async function GET(
    req: Request,
    context: { params: Promise<{ eventId: string }> }
) {
    const { eventId } = await context.params;

    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/event?event_id=${eventId}`;

    const res = await fetch(apiUrl);
    const data = await res.json();

    return Response.json(data, { status: res.status });
}

export async function POST(
    req: Request,
    context: { params: Promise<{ eventId: string }> }
) {
    const { eventId } = await context.params;

    const body = await req.json();

    const res = await callBackend("/update_event", {
        method: "POST",
        body: JSON.stringify({
            event_id: Number(eventId),
            ...body
        })
    });

    // Backend returns JSON on success, plain text on error — pass through raw.
    return new Response(await res.text(), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
    });
}
