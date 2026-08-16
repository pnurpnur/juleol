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

      // Hent lagret valg fra localStorage
      const savedSelection = localStorage.getItem("selectedEventId");
      if (savedSelection && data.some((e: any) => String(e.id) === savedSelection)) {
        setSelected(savedSelection);
      } else if (data.length >= 1) {
        // Hvis ikke lagret valg eller eventet finnes ikke, velg det første
        setSelected(String(data[0].id));
      }
    }
    loadEvents();
  }, [userId]); // ⚡ kjør på nytt når userId blir tilgjengelig

  // Lagre valg når det endres
  useEffect(() => {
    if (selected) {
      localStorage.setItem("selectedEventId", selected);
    }
  }, [selected]);

  if (!userId) return null;

  // Determine the currently selected event object
  const selectedEvent =
    events.find((ev) => String(ev.id) === selected) ?? events[0] ?? null;

  const eventIsOpen =
    ((selectedEvent && selectedEvent.is_open) ?? false);

   const userIsOwner =
    ((selectedEvent && (selectedEvent.owner_id == userId)) ?? false);

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

  function showFasit() {
    if (selected) {
      router.push(`/event/${selected}/fasit`);
    }
  }

  function showSummary() {
    if (selected) {
      router.push(`/event/${selected}/summary`);
    }
  }

  function goToAdmin() {
    if (selected) {
      router.push(`/admin/events/${selected}`);
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
      {(eventIsOpen || userIsOwner) && (
        <button
          disabled={!selected}
          onClick={start}
          className={styles.startButton}
        >
          Start smaking
        </button>
      )}

      {/* Se fasit og oppsummering — kun vises hvis event er stengt */}
      {!eventIsOpen && selected && (
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button
            onClick={showFasit}
            className={styles.fasitButton}
          >
            Se fasit
          </button>
          <button
            onClick={showSummary}
            className={styles.fasitButton}
          >
            Se oppsummering
          </button>
        </div>
      )}

      {/* Se resultater — kun vises hvis event er stengt eller user = owner */}
      {(!eventIsOpen || userIsOwner) && (
        <button
            disabled={!selected}
            onClick={showResults}
            className={styles.resultsButton}
        >
            Se resultater
        </button>
        )}

      {/* Admin-knapp for event-eiere */}
      {userIsOwner && selected && (
        <button
          onClick={goToAdmin}
          className={styles.adminButton}
        >
          Admin
        </button>
      )}
    </div>
  );
}
