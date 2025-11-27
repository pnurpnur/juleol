// src/lib/useRating.ts
import { useEffect, useState } from "react";
import { fetchRating } from "./api";

export function useRating(eventId: number, beerId: number) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !beerId) return;

    setLoading(true);
    fetchRating(eventId, beerId)
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [eventId, beerId]);

  return { data, loading };
}
