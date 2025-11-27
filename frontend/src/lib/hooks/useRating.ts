"use client";

import { useEffect, useState } from "react";
import { getRating } from "../api";
import { Rating } from "@/types";

export function useRating(eventId: number, beerId: number, userId: string) {
  const [data, setData] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !beerId || !userId) return;
    setLoading(true);

    getRating(eventId, beerId, userId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [eventId, beerId, userId]);

  return { data, loading };
}
