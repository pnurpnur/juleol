"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./EventSelector.module.css";

export default function EventSelector({ userId }: { userId?: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadEvents() {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data);

      // Hvis ett event → velg det automatisk
      if (data.length === 1) {
        setSelected(String(data[0].id));
      } else if (data.length > 0) {
        // Flere events → velg nyeste
        setSelected(String(data[0].id));
      }
    }
    loadEvents();
  }, []);

  if (!userId) return null;

  function start() {
    if (selected) {
      router.push(`/event/${selected}/beer/1`);
    }
  }

  function showResults() {
    if (selected) {
      router.push(`/results?event=${selected}`);
    }
  }

  return (
    <div className={styles.container}>
      
      {/* Dropdown vises kun hvis det finnes mer enn ett event */}
      {events.length > 1 && (
        <select
          className={styles.select}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
      )}

      {/* Start konkurranse */}
      <button
        disabled={!selected}
        onClick={start}
        className={styles.startButton}
      >
        Start smaking
      </button>

      {/* Se resultater */}
      <button
        disabled={!selected}
        onClick={showResults}
        className={styles.resultsButton}
      >
        Se resultater
      </button>

    </div>
  );
}
