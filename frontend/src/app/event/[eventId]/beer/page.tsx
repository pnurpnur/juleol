import { auth } from "@/auth";
import GuessForm from "@/components/GuessForm";
import { redirect } from "next/navigation";
import { fetchGuess, fetchRating } from "@/lib/api"; // våre frontend helpers

export default async function BeerPage({ params }: { params: { eventId: string; beerNumber: string } }) {
  const session = await auth();
  if (!session) redirect("/");

  const { eventId, beerNumber } = params;

  const api = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Hent event-spesifikke valg (fra Go-backenden)
  const [beerOptionsRes, abvRes, typesRes] = await Promise.all([
    fetch(`${api}/event_beer_options?event_id=${eventId}`, { cache: "no-store" }),
    fetch(`${api}/event_abv_ranges?event_id=${eventId}`, { cache: "no-store" }),
    fetch(`${api}/types`, { cache: "no-store" }),
  ]);

  const [beerOptions, abvRanges, types] = await Promise.all([
    beerOptionsRes.json(),
    abvRes.json(),
    typesRes.json(),
  ]);

  // Hent gjett og rating fra vår egen Next-API (ikke direkte backend-endepunkt)
  const [guess, rating] = await Promise.all([
    fetchGuess(Number(eventId), Number(beerNumber)),
    fetchRating(Number(eventId), Number(beerNumber)),
  ]);

  return (
    <div>
      {/* GuessForm er din gamle komponent */}
      <GuessForm
        eventId={Number(eventId)}
        beerId={Number(beerNumber)}
        beerOptions={beerOptions}
        abvRanges={abvRanges}
        types={types}
        initialGuess={guess}
        userId={session.user.id}
        totalBeers={12}
        initialRating={rating} // NYTT!
      />
    </div>
  );
}
