"use client";

import { useEffect, useState } from "react";
import { getGuess } from "../api";
import { Guess } from "@/types";

export function useGuess(eventId: number, beerId: number, userId: string) {
  const [data, setData] = useState<Guess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !beerId || !userId) return;
    setLoading(true);

    getGuess(eventId, beerId, userId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [eventId, beerId, userId]);

  return { data, loading };
}
