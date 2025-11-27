"use client";

import { useEffect, useState } from "react";
import { getGuesses } from "../api";
import { Guess } from "@/types";

export function useGuesses(eventId: number, userId: string) {
  const [data, setData] = useState<Guess[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !userId) return;
    setLoading(true);

    getGuesses(eventId, userId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [eventId, userId]);

  return { data, loading };
}
