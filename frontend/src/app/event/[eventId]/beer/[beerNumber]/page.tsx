import { auth } from "@/auth";
import { redirect } from "next/navigation";
import BeerClientPage from "./BeerClientPage";

export default async function Page(props: { params: Promise<{ eventId: string; beerNumber: string }>}) {
  // ⭐ Params is now a Promise and must be awaited
  const params = await props.params;

  const session = await auth();
  if (!session) redirect("/");

  const eventId = Number(params.eventId);
  const beerId = Number(params.beerNumber);
  const userId = session.user.id;

  // Fetch event metadata server-side and only show page if event is open
  // Uses both camelCase and snake_case for compatibility
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const res = await fetch(`${base}/events?event_id=${eventId}`, { cache: "no-store" });
  if (!res.ok) {
    // If event can't be loaded, redirect to index (or choose a 404 page)
    redirect("/");
  }
  const event = await res.json();
  const isOpen = event[0].is_open ?? false;
  const owner = event[0].owner_id;

  if (!isOpen && userId != owner) redirect("/");

  return (
    <BeerClientPage
      eventId={eventId}
      beerId={beerId}
      userId={userId}
    />
  );
}
