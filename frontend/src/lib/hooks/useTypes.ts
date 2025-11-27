"use client";

import { useEffect, useState } from "react";
import { getTypes } from "../api";
import { BeerType } from "@/types";

export function useTypes() {
  const [data, setData] = useState<BeerType[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTypes()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
