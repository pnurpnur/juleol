// app/api/events/[eventId]/route.ts

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

    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/update_event`;

    const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            event_id: Number(eventId),
            ...body
        })
    });

    const data = await res.json();

    return Response.json(data, { status: res.status });
}
