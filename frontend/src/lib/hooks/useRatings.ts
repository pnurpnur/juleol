"use client";

import { useEffect, useState } from "react";
import { getRatings } from "../api";
import { Rating } from "@/types";

export function useRatings(eventId: number) {
  const [data, setData] = useState<Rating[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);

    getRatings(eventId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [eventId]);

  return { data, loading };
}
