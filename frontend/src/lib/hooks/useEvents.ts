"use client";

import { useEffect, useState } from "react";
import { getEvents } from "../api";
import { Event } from "@/types";

export function useEvents() {
  const [data, setData] = useState<Event[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    getEvents()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
