"use client";

import { useEventWithBeers } from "@/lib/hooks/useEventWithBeers";
import GuessForm from "@/components/GuessForm";

export default function BeerClientPage({ eventId, beerNumber, beerId, totalBeers, userId }) {
  const { beerOptions, abvRanges, types, guess, rating, loading, error } =
    useEventWithBeers(eventId, beerId, userId);

  if (loading) return <div>Laster…</div>;
  if (error) return <div>Feil: {error.message}</div>;

  return (
    <GuessForm
      key={beerId}
      eventId={eventId}
      beerNumber={beerNumber}
      beerId={beerId}
      beerOptions={beerOptions}
      abvRanges={abvRanges}
      types={types}
      initialGuess={guess}
      initialRating={rating}
      userId={userId}
      totalBeers={totalBeers}
    />
  );
}
