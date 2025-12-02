"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./EventSelector.module.css";

export default function EventSelector({ userId }: { userId?: number }) {
  const [events, setEvents] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!userId) return; // vent til userId er klar

    async function loadEvents() {
      const res = await fetch(`/api/events?user_id=${userId}`);
      if (!res.ok) {
        console.error("Kunne ikke hente events");
        return;
      }
      const data = await res.json();
      setEvents(data);

      // Hvis ett event → velg det automatisk
      if (data.length >= 1) {
        setSelected(String(data[0].id));
      }
    }
    loadEvents();
  }, [userId]); // ⚡ kjør på nytt når userId blir tilgjengelig

  if (!userId) return null;

  // Determine the currently selected event object
  const selectedEvent =
    events.find((ev) => String(ev.id) === selected) ?? events[0] ?? null;

  // Support both camelCase and snake_case "open" flag
  const eventIsOpen =
    (selectedEvent && (selectedEvent.isOpen ?? selectedEvent.is_open ?? false)) ||
    false;

  function start() {
    if (selected) {
      router.push(`/event/${selected}/beer/1`);
    }
  }

  function showResults() {
    if (selected) {
      router.push(`/event/${selected}/results`);
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

      {/* Start konkurranse — kun vises hvis event er åpen */}
      {eventIsOpen && (
        <button
          disabled={!selected}
          onClick={start}
          className={styles.startButton}
        >
          Start smaking
        </button>
      )}

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
