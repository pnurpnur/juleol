"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./ResultsClient.module.css";

interface BeerStats {
  nameCorrect: number;
  typeCorrect: number;
  abvCorrect: number;
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

  // Funksjon for å bytte kort med looping
  const changeIndex = useCallback(
    (delta: number) => {
      if (!data.length) return;
      setAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + delta + data.length) % data.length);
        setAnimating(false);
      }, 200); // Match transition
    },
    [data.length]
  );

  // Tastaturpiler
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
      {/* Logo */}
      <img
        src="/logo.png"
        alt="Logo"
        style={{ width: "150px", marginBottom: "2rem" }}
      />

      {/* Kortkarusell */}
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
        <div className={styles.fasitRow}>
          <strong>#{currentItem.beerId}</strong>
        </div>

        <div className={styles.fasitRow}>
          <span>Øl:</span>
          <b>{currentItem.name}</b>
        </div>

        <div className={styles.fasitRow}>
          <span>Stil:</span>
          {currentItem.type}
        </div>

        <div className={styles.fasitRow}>
          <span>ABV:</span>
          {currentItem.abv}
        </div>

        <hr style={{ margin: "1rem 0" }} />

        <div className={styles.fasitRow}>
          <span>Riktig øl:</span>
          {currentItem.stats.nameCorrect}
        </div>

        <div className={styles.fasitRow}>
          <span>Riktig stil:</span>
          {currentItem.stats.typeCorrect}
        </div>

        <div className={styles.fasitRow}>
          <span>Riktig ABV:</span>
          {currentItem.stats.abvCorrect}
        </div>
      </div>

      {/* Navigasjonspiler */}
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
