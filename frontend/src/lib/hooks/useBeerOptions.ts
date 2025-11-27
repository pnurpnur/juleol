"use client";

import { useEffect, useState } from "react";
import { getEventBeerOptions } from "../api";
import { BeerOption } from "@/types";

export function useBeerOptions(eventId: number | null) {
  const [data, setData] = useState<BeerOption[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);

    getEventBeerOptions(eventId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [eventId]);

  return { data, loading };
}
