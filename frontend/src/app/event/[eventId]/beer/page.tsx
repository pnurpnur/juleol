"use client";

import { useEffect, useState } from "react";
import { useEventWithBeers } from "@/lib/hooks/useEventWithBeers";
import GuessForm from "@/components/GuessForm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default function BeerPage({ params }: { params: { eventId: string; beerNumber: string } }) {
  const [userId, setUserId] = useState<string | null>(null);

  // Auth må kjøres i klienten her, siden hooken krever userId
  useEffect(() => {
    auth().then((session) => {
      if (!session) {
        redirect("/");
        return;
      }
      setUserId(session.user.id);
    });
  }, []);

  if (!userId) {
    return <div>Laster bruker...</div>;
  }

  const eventId = Number(params.eventId);
  const beerId = Number(params.beerNumber);

  const {
    beerOptions,
    abvRanges,
    types,
    guess,
    rating,
    loading,
    error,
  } = useEventWithBeers(eventId, beerId, userId);

  if (loading) return <div>Laster data...</div>;
  if (error) return <div>Feil: {error.message}</div>;

  if (!beerOptions || !abvRanges || !types) {
    return <div>Mangler data.</div>;
  }

  return (
    <GuessForm
      eventId={eventId}
      beerId={beerId}
      beerOptions={beerOptions}
      abvRanges={abvRanges}
      types={types}
      initialGuess={guess}
      initialRating={rating}
      userId={userId}
      totalBeers={12} // evt. dynamisk senere
    />
  );
}
