// src/lib/useGuesses.ts
import { useEffect, useState } from "react";
import { fetchGuesses } from "./api";

export function useGuesses(eventId: number) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    
    setLoading(true);
    fetchGuesses(eventId)
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [eventId]);

  return { data, loading };
}
