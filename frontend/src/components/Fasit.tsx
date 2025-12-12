"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./ResultsClient.module.css";

interface BeerStats {
  nameCorrect: number;
  typeCorrect: number;
  abvCorrect: number;
  nameWinner?: string | null;
  typeWinner?: string | null;
  abvWinner?: string | null;
}

interface FasitItem {
  beerId: number;
  name: string;
  type: string;
  abv: string;
  stats: BeerStats;
}

interface FasitApiItem {
  beer_id: number;
  correct_name: string;
  correct_type: string;
  correct_abv: string;
  stats: {
    name_correct: number;
    type_correct: number;
    abv_correct: number;
    name_winner?: string | null;
    type_winner?: string | null;
    abv_winner?: string | null;
  };
}

interface FasitResponse {
  items: FasitApiItem[];
}

export default function Fasit({ eventId }: { eventId: number }) {
  const [data, setData] = useState<FasitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  async function load() {
    try {
      const res = await fetch(`/api/event_fasit_stats?event_id=${eventId}`);
      const json: FasitResponse = await res.json();

      const mapped: FasitItem[] = json.items.map((item) => ({
        beerId: item.beer_id,
        name: item.correct_name,
        type: item.correct_type,
        abv: item.correct_abv,
        stats: {
          nameCorrect: item.stats.name_correct,
          typeCorrect: item.stats.type_correct,
          abvCorrect: item.stats.abv_correct,
          nameWinner: item.stats.name_winner || null,
          typeWinner: item.stats.type_winner || null,
          abvWinner: item.stats.abv_winner || null,
        },
      }));

      setData(mapped);
    } catch (err) {
      console.error("Error fetching fasit:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [eventId]);

  const changeIndex = useCallback(
    (delta: number) => {
      if (!data.length) return;
      setAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + delta + data.length) % data.length);
        setAnimating(false);
      }, 200);
    },
    [data.length]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") changeIndex(1);
      if (e.key === "ArrowLeft") changeIndex(-1);
    },
    [changeIndex]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (loading) return <div>Laster fasit…</div>;
  if (!data.length) return <div>Ingen øl å vise.</div>;

  const currentItem = data[currentIndex];

  return (
    <section style={{ padding: "2rem", textAlign: "center" }}>
      <img
        src="/logo.png"
        alt="Logo"
        style={{ width: "150px", marginBottom: "2rem" }}
      />

      <div
        className={styles.fasitCard}
        style={{
          margin: "0 auto",
          fontSize: "1.2rem",
          maxWidth: "500px",
          transition: "transform 0.2s ease, opacity 0.2s ease",
          transform: animating ? "translateX(20px)" : "translateX(0)",
          opacity: animating ? 0 : 1,
        }}
      >
        <div
            className={styles.fasitRow}
            style={{ justifyContent: "center", fontSize: "1.4rem", marginBottom: "1rem" }}
        >
            <strong>#{currentItem.beerId}</strong>
        </div>

        <div className={styles.fasitRow}>
          <span>Øl:</span>
          <b>{currentItem.name}</b>
        </div>

        <div className={styles.fasitRow}>
          <span>Type:</span>
          {currentItem.type}
        </div>

        <div className={styles.fasitRow}>
          <span>ABV:</span>
          {currentItem.abv}
        </div>

        <hr style={{ margin: "1rem 0" }} />

        {/* ØL */}
        <div className={styles.fasitRow}>
          <span>🍺 Riktig øl:</span>
          {currentItem.stats.nameCorrect}
        </div>
        {currentItem.stats.nameCorrect === 1 && currentItem.stats.nameWinner && (
            <div className={styles.winnerRow}>
                🎯 <b>{currentItem.stats.nameWinner}</b> var eneste som traff riktig øl!
            </div>
        )}

        <hr style={{ margin: "1rem 0" }} />

        {/* STIL */}
        <div className={styles.fasitRow}>
          <span>🏷️ Riktig type:</span>
          {currentItem.stats.typeCorrect}
        </div>
        {currentItem.stats.typeCorrect === 1 && currentItem.stats.typeWinner && (
            <div className={styles.winnerRow}>
                🎯 <b>{currentItem.stats.typeWinner}</b> var eneste som traff riktig type!
            </div>
        )}

        <hr style={{ margin: "1rem 0" }} />

        {/* ABV */}
        <div className={styles.fasitRow}>
          <span>🌡️ Riktig ABV:</span>
          {currentItem.stats.abvCorrect}
        </div>
        {currentItem.stats.abvCorrect === 1 && currentItem.stats.abvWinner && (
            <div className={styles.winnerRow}>
                🎯 <b>{currentItem.stats.abvWinner}</b> var eneste som traff riktig styrke!
            </div>
        )}
      </div>

      <div
        style={{
          marginTop: "2rem",
          display: "flex",
          justifyContent: "center",
          gap: "2rem",
          fontSize: "1.5rem",
        }}
      >
        <button onClick={() => changeIndex(-1)}>◀</button>
        <span>
          {currentIndex + 1} / {data.length}
        </span>
        <button onClick={() => changeIndex(1)}>▶</button>
      </div>
    </section>
  );
}
