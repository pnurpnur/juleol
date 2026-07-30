import { auth } from "@/auth";
import { redirect } from "next/navigation";
import BeerClientPage from "./BeerClientPage";

export default async function Page(props: { params: Promise<{ eventId: string; beerNumber: string }> }) {
  const params = await props.params;

  const session = await auth();
  if (!session) redirect("/");

  const eventId = Number(params.eventId);
  const position = Number(params.beerNumber); // 1-based tasting position, not a beer id
  const userId = session.user.id;

  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

  // Load the specific event (not the newest one).
  const evRes = await fetch(`${base}/event?event_id=${eventId}`, { cache: "no-store" });
  if (!evRes.ok) redirect("/");
  const event = await evRes.json();
  const isOpen = event?.is_open ?? false;
  const owner = event?.owner_id;
  if (!isOpen && userId != owner) redirect("/");

  // Load this event's beers in tasting order and map position -> real beer id.
  const beersRes = await fetch(`${base}/event_beers?event_id=${eventId}`, { cache: "no-store" });
  const beers = beersRes.ok ? await beersRes.json() : [];
  const list: any[] = Array.isArray(beers) ? beers : [];
  const totalBeers = list.length;

  if (totalBeers === 0) redirect("/");
  if (!Number.isInteger(position) || position < 1 || position > totalBeers) {
    redirect(`/event/${eventId}/beer/1`);
  }

  const beerId = list[position - 1].id;

  return (
    <BeerClientPage
      eventId={eventId}
      beerNumber={position}
      beerId={beerId}
      totalBeers={totalBeers}
      userId={userId}
    />
  );
}
