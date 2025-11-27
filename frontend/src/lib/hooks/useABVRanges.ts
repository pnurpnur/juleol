"use client";

import { useEffect, useState } from "react";
import { getEventABVRanges } from "../api";
import { ABVRange } from "@/types";

export function useABVRanges(eventId: number | null) {
  const [data, setData] = useState<ABVRange[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);

    getEventABVRanges(eventId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [eventId]);

  return { data, loading };
}
