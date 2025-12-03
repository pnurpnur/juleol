"use client";
import { useState } from "react";
import ResultsClient from "./ResultsClient";
import Leaderboard from "./Leaderboard";
import BestBeers from "./BestBeers";
import styles from "./ResultsPage.module.css";

interface ResultsData {
  standings: Standing[];
  totalParticipants: number;
}

interface Standing {
  userId: number;
  userName: string;
  placement: number;
  points: number;
  beerPoints: number;
  abvPoints: number;
  typePoints: number;
}

export default function ResultsPage({
  eventId,
  userId,
  initialResults,
}: {
  eventId: number;
  userId: number;
  initialResults: ResultsData;
}) {
  const [view, setView] = useState<"results" | "leaderboard" | "bestbeers">("results");

  return (
    <section className={styles.container}>
      <nav className={styles.nav}>
        <button
          className={`${styles.navButton} ${view === "results" ? styles.active : ""}`}
          onClick={() => setView("results")}
        >
          Ditt resultat
        </button>
        <button
          className={`${styles.navButton} ${view === "leaderboard" ? styles.active : ""}`}
          onClick={() => setView("leaderboard")}
        >
          Beste ølhund
        </button>
        <button
          className={`${styles.navButton} ${view === "bestbeers" ? styles.active : ""}`}
          onClick={() => setView("bestbeers")}
        >
          Beste øl
        </button>
      </nav>

      <div className={styles.content}>
        {view === "results" && (
          <ResultsClient eventId={eventId} userId={userId} initialResults={initialResults} />
        )}
        {view === "leaderboard" && (
          <Leaderboard
            standings={initialResults.standings}
            selectedUserId={userId}
          />
        )}
        {view === "bestbeers" && <BestBeers eventId={eventId} />}
      </div>
    </section>
  );
}