"use client";

import { useEffect, useState } from "react";

import {
  getEventBeerOptions,
  getEventABVRanges,
  getTypes,
  getGuess,
  getRating,
} from "../api";

import {
  BeerOption,
  ABVRange,
  BeerType,
  Guess,
  Rating,
} from "@/types";

interface EventWithBeersResult {
  beerOptions: BeerOption[] | null;
  abvRanges: ABVRange[] | null;
  types: BeerType[] | null;
  guess: Guess | null;
  rating: Rating | null;
  loading: boolean;
  error: any;
}

export function useEventWithBeers(
  eventId: number,
  beerId: number,
  userId: string
): EventWithBeersResult {
  const [beerOptions, setBeerOptions] = useState<BeerOption[] | null>(null);
  const [abvRanges, setABVRanges] = useState<ABVRange[] | null>(null);
  const [types, setTypes] = useState<BeerType[] | null>(null);
  const [guess, setGuess] = useState<Guess | null>(null);
  const [rating, setRating] = useState<Rating | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!eventId || !beerId || !userId) return;

    setLoading(true);
    setError(null);

    Promise.all([
      getEventBeerOptions(eventId),
      getEventABVRanges(eventId),
      getTypes(),
      getGuess(eventId, beerId, userId),
      getRating(eventId, beerId, userId),
    ])
      .then(([opts, abv, typesData, guessData, ratingData]) => {
        setBeerOptions(opts);
        setABVRanges(abv);
        setTypes(typesData);
        setGuess(guessData);
        setRating(ratingData);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [eventId, beerId, userId]);

  return {
    beerOptions,
    abvRanges,
    types,
    guess,
    rating,
    loading,
    error,
  };
}
