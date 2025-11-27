// src/lib/useGuess.ts
import { useEffect, useState } from "react";
import { fetchGuess } from "./api";

export function useGuess(eventId: number, beerId: number) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !beerId) return;

    setLoading(true);
    fetchGuess(eventId, beerId)
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [eventId, beerId]);

  return { data, loading };
}
