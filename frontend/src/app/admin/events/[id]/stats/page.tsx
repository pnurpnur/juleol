"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EventStatsPage() {
  const params = useParams();
  const eventId = Number(params.id);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadStats() {
    setLoading(true);
    try {
      const res = await fetch(`/api/event_stats?event_id=${eventId}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("stats fetch error:", err);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadStats();
  }, [eventId]);

  async function toggleEventOpen() {
    setActionLoading(true);

    const res = await fetch(`/api/events/${eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            is_open: !stats.is_open,
        }),
    });

    await loadStats();
    setActionLoading(false);
  }

  if (loading) return <div>Laster…</div>;

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Administrasjon: {stats.name}</h2>

      <div style={{ marginTop: "1.5rem" }}>
        <h3>Status</h3>
        <p><b>Event åpen:</b> {stats.is_open ? "Ja" : "Nei"}</p>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <h3>Statistikk</h3>

        {/* Ratings */}
        <h4>Ratings</h4>
        {(() => {
            const entries = Object.entries(stats.ratings ?? {}) as [string, unknown][];
            // Konverter til numbers trygt
            const counts = entries.map(([_, v]) => Number(v ?? 0));
            const max = counts.length > 0 ? Math.max(...counts) : 0;

            const notMax = entries
            .map(([name, v]) => ({ name, count: Number(v ?? 0) }))
            .filter((x) => x.count < max);

            return (
            <div>
                <p><b>Maks ratinger:</b> {max}</p>

                {notMax.length > 0 ? (
                <ul>
                    {notMax.map((row) => (
                    <li key={row.name}>
                        {row.name}: {row.count}
                    </li>
                    ))}
                </ul>
                ) : (
                <p>Alle har maks ratinger 🎉</p>
                )}
            </div>
            );
        })()}

        {/* Guesses */}
        <h4>Gjetninger</h4>
        {(() => {
            const entries = Object.entries(stats.guesses ?? {}) as [string, unknown][];
            const counts = entries.map(([_, v]) => Number(v ?? 0));
            const max = counts.length > 0 ? Math.max(...counts) : 0;

            const notMax = entries
            .map(([name, v]) => ({ name, count: Number(v ?? 0) }))
            .filter((x) => x.count < max);

            return (
            <div>
                <p><b>Maks gjetninger:</b> {max}</p>

                {notMax.length > 0 ? (
                <ul>
                    {notMax.map((row) => (
                    <li key={row.name}>
                        {row.name}: {row.count}
                    </li>
                    ))}
                </ul>
                ) : (
                <p>Alle har maks gjetninger 🎉</p>
                )}
            </div>
            );
        })()}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <button onClick={toggleEventOpen} disabled={actionLoading}>
          {stats.is_open ? "Lås event" : "Åpne event"}
        </button>
      </div>

      <hr style={{ margin: "2rem 0" }} />

      <div>
        <a href={`/admin/events/${eventId}`}>⬅ Tilbake til admin-siden</a>
      </div>
    </div>
  );
}
