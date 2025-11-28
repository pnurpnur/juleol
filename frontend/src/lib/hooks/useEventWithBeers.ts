"use client";

import { useState, useEffect } from "react";

export function useEventWithBeers(eventId, beerId, userId) {
  const [beerOptions, setBeerOptions] = useState([]);
  const [abvRanges, setAbvRanges] = useState([]);
  const [types, setTypes] = useState([]);
  const [guess, setGuess] = useState(null);
  const [rating, setRating] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [optRes, abvRes, typeRes, guessRes, ratingRes] =
          await Promise.all([
            fetch(`/api/events/${eventId}/beer-options`),
            fetch(`/api/events/${eventId}/abv-options`),
            fetch(`/api/types`),
            fetch(
              `/api/events/${eventId}/beer/${beerId}/guess?user_id=${userId}`
            ),
            fetch(
              `/api/events/${eventId}/beer/${beerId}/rating?user_id=${userId}`
            ),
          ]);

        setBeerOptions(await optRes.json());
        setAbvRanges(await abvRes.json());
        setTypes(await typeRes.json());

        setGuess(guessRes.ok ? await guessRes.json() : null);
        setRating(ratingRes.ok ? await ratingRes.json() : null);

        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    }

    load();
  }, [eventId, beerId, userId]);

  return { beerOptions, abvRanges, types, guess, rating, loading, error };
}
