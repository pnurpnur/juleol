import { auth } from "@/auth";
import GuessForm from "@/components/GuessForm";
import { redirect } from "next/navigation";

export default async function BeerPage({ params }) {
  const session = await auth();
  if (!session) redirect("/");

  const { eventId, beerNumber } = params;

  // Fetch data from backend
  const api = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [beerOptionsRes, abvRes, typesRes, guessRes] = await Promise.all([
    fetch(`${api}/event_beer_options?event_id=${eventId}`, { cache: "no-store" }),
    fetch(`${api}/event_abv_ranges?event_id=${eventId}`, { cache: "no-store" }),
    fetch(`${api}/types`, { cache: "no-store" }),
    fetch(`${api}/get_guess?event_id=${eventId}&beer_id=${beerNumber}&user_id=${session.user.id}`, { cache: "no-store" }),
  ]);

  const beerOptions = await beerOptionsRes.json();
  const abvRanges = await abvRes.json();
  const types = await typesRes.json();

  const guess = guessRes.ok ? await guessRes.json() : null;

  return (
    <GuessForm
      eventId={Number(eventId)}
      beerId={Number(beerNumber)}
      beerOptions={beerOptions}
      abvRanges={abvRanges}
      types={types}
      initialGuess={guess}
      userId={session.user.id}
      totalBeers={12}
    />
  );
}
