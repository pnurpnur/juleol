"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./ResultsClient.module.css";

const iconStyle = (icon: string): React.CSSProperties => {
  const map: Record<string, string> = {
    "🏆": "#f5c542", // gull
    "🥇": "#f5c542",
    "🥈": "#c0c0c0",
    "🥉": "#cd7f32",
    "😍": "#4caf50", // grønn
    "🎯": "#4caf50",
    "🧠": "#4caf50",
    "😖": "#f44336", // rød
    "🤡": "#f44336",
    "❌": "#f44336",
    "🤔": "#ff9800", // oransje
    "🙈": "#ff9800",
  };

  return {
    color: map[icon] ?? "inherit",
    fontSize: "1.2rem",
    lineHeight: 1,
  };
};

/* =======================
   TYPER
======================= */

type CorrectGuess = {
  name: boolean;
  type: boolean;
  abv: boolean;
};

type Participant = {
  name: string;
  guessed: {
    name: string;
    type: string;
    abv: string;
  };
  rating: number;
  correct: CorrectGuess;
};

type RatingExtrema = {
  name: string;
  rating: number;
};

type BeerSummary = {
  beer_id: number;
  correct: {
    name: string;
    type: string;
    abv: string;
  };
  average_rating: number;
  participants: Participant[];
  summary: {
    all_correct: string[];
    all_wrong: string[];
    correct_beer: string[];
    wrong_beer: string[];
    correct_type: string[];
    wrong_type: string[];
    correct_abv: string[];
    wrong_abv: string[];
    highest_rating: RatingExtrema[];
    lowest_rating: RatingExtrema[];
  };
};

type EventSummaryResponse = {
  event_id: number;
  beers: BeerSummary[];
};

/* =======================
   ANALYSE
======================= */

function analyzeBeers(beers: BeerSummary[]) {
  const perBeerFacts = beers.map(beer => {
    const total = beer.participants.length - 1;

    const oneOrAll = (arr: string[]) => {
      if (arr.length === 1) return "one";
      if (arr.length === total) return "all";
      if (arr.length === 0) return "none";
      return null;
    };

    return {
      beerId: beer.beer_id,

      beerGuess: {
        correct: oneOrAll(beer.summary.correct_beer),
        wrong: oneOrAll(beer.summary.wrong_beer),
        namesCorrect: beer.summary.correct_beer,
        namesWrong: beer.summary.wrong_beer,
      },

      typeGuess: {
        correct: oneOrAll(beer.summary.correct_type),
        wrong: oneOrAll(beer.summary.wrong_type),
        namesCorrect: beer.summary.correct_type,
        namesWrong: beer.summary.wrong_type,
      },

      abvGuess: {
        correct: oneOrAll(beer.summary.correct_abv),
        wrong: oneOrAll(beer.summary.wrong_abv),
        namesCorrect: beer.summary.correct_abv,
        namesWrong: beer.summary.wrong_abv,
      },
    };
  });

  // Snitt per deltaker
  const ratingMap: Record<string, number[]> = {};

  beers.forEach(b =>
    b.participants.forEach(p => {
      if (!ratingMap[p.name]) ratingMap[p.name] = [];
      ratingMap[p.name].push(p.rating);
    })
  );

  const averages = Object.entries(ratingMap).map(([name, ratings]) => ({
    name,
    avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
  }));

  const highestAvg = Math.max(...averages.map(a => a.avg));
  const lowestAvg = Math.min(...averages.map(a => a.avg));

  const highestRaters = averages.filter(a => a.avg === highestAvg);
  const lowestRaters = averages.filter(a => a.avg === lowestAvg);

  const stdDev = (arr: number[]) => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);
  };

  const mostDisagreedBeer = beers
    .map(b => ({
      beerId: b.beer_id,
      sd: stdDev(b.participants.map(p => p.rating)),
    }))
    .sort((a, b) => b.sd - a.sd)[0];

  return {
    perBeerFacts,
    global: {
      highestRaters,
      lowestRaters,
      mostDisagreedBeer,
    },
  };
}

/* =======================
   TEKSTBYGGER
======================= */

function formatNames(names: string[]) {
  const firstNames = names.map(n => n.split(" ")[0]);

  if (firstNames.length === 0) return "";
  if (firstNames.length === 1) return firstNames[0];
  if (firstNames.length === 2) {
    return `${firstNames[0]} og ${firstNames[1]}`;
  }

  return `${firstNames.slice(0, -1).join(", ")} og ${firstNames.at(-1)}`;
}

function buildBeerSummaryText({
  beer,
  rank,
  facts,
  analysis,
}: {
  beer: BeerSummary;
  rank: number;
  facts: ReturnType<typeof analyzeBeers>["perBeerFacts"][number] | null;
  analysis: ReturnType<typeof analyzeBeers>;
}): {
  title: string;
  body: { icon: string; text: string }[];
} {
  const body: { icon: string; text: string }[] = [];

  const title = `Øl #${beer.beer_id}: ${beer.correct.name}`;

  body.push({
    icon: "🏆",
    text: `Snittrating ${beer.average_rating.toFixed(2)} – plassering nr. ${rank}`,
  });

  if (analysis.global.mostDisagreedBeer.beerId === beer.beer_id) {
    body.push({
      icon: "🤔",
      text: "Dette var ølet deltakerne var mest uenige om.",
    });
  }

  if (!facts) return { title, body };

  // 😍 Elsket (≥ 9)
  const loved = beer.participants.filter(p => p.rating >= 9);
  if (loved.length > 0) {
    body.push({
      icon: "😍",
      text: `Elsket av ${formatNames(loved.map(p => p.name))}`,
    });
  }

  // 😖 Hatet (≤ 3)
  const hated = beer.participants.filter(p => p.rating <= 3);
  if (hated.length > 0) {
    body.push({
      icon: "😖",
      text: `Ikke likt av ${formatNames(hated.map(p => p.name))}`,
    });
  }

  if (beer.summary.all_correct.length > 0) {
    body.push({
      icon: "🎯",
      text: `Alt riktig for ${formatNames(beer.summary.all_correct)}`,
    });
  }

  if (beer.summary.all_wrong.length > 0) {
    body.push({
      icon: "🤡",
      text: `Alt feil for ${formatNames(beer.summary.all_wrong)}`,
    });
  }

  if (facts.beerGuess.correct === "one") {
    body.push({
      icon: "🧠",
      text: `${formatNames(facts.beerGuess.namesCorrect)} var den eneste som traff ølet`,
    });
  }

  if (facts.beerGuess.wrong === "one") {
    body.push({
      icon: "🙈",
      text: `${formatNames(facts.beerGuess.namesWrong)} var alene om å bomme`,
    });
  }

  if (facts.beerGuess.correct === "none") {
    body.push({
      icon: "❌",
      text: "Ingen klarte å gjette ølet",
    });
  }

  return { title, body };
}

// =======================
// KOMPONENT
// =======================

export default function EventSummary({ eventId }: { eventId: number }) {
  /* ---- STATE ---- */
  const [data, setData] = useState<EventSummaryResponse | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  /* ---- DATA ---- */
  const beers = data?.beers ?? [];
  const totalSlides = beers.length + 1;
  const analysis = beers.length ? analyzeBeers(beers) : null;

  const isGlobalCard = index === 0;
  const beer = !isGlobalCard ? beers[index - 1] : null;

  const rankedBeers = [...beers].sort(
    (a, b) => b.average_rating - a.average_rating
  );

  const rank =
    beer ? rankedBeers.findIndex(b => b.beer_id === beer.beer_id) + 1 : 0;

  const facts =
    beer && analysis
      ? analysis.perBeerFacts.find(f => f.beerId === beer.beer_id) ?? null
      : null;

  const winningBeer = rankedBeers[0];

  /* ---- CALLBACKS ---- */
  const changeIndex = useCallback(
    (delta: number) => {
      if (!totalSlides) return;
      setAnimating(true);
      setTimeout(() => {
        setIndex(i => (i + delta + totalSlides) % totalSlides);
        setAnimating(false);
      }, 200);
    },
    [totalSlides]
  );

  /* ---- EFFECTS ---- */
  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/event_summary?event_id=${eventId}`);
      if (res.ok) setData(await res.json());

      const ownerRes = await fetch(`/api/events/${eventId}`);
      if (ownerRes.ok) {
        const o = await ownerRes.json();
        setOwner(o.owner_name);
        setName(o.name);
      }

      const winnerRes = await fetch(`/api/leaderboard?event_id=${eventId}`);
      if (winnerRes.ok) {
        const w = await winnerRes.json();
        if (w.standings?.length) setWinner(w.standings[0].userName);
      }
    }
    load();
  }, [eventId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") changeIndex(-1);
      if (e.key === "ArrowRight") changeIndex(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changeIndex]);

  /* ---- EARLY RETURN (TRYGT) ---- */
  if (!data || !analysis) {
    return <div>Laster oppsummering…</div>;
  }

  /* ---- RENDER ---- */
  return (
    <section style={{ padding: "2rem", textAlign: "center" }}>
      <img src="/logo.png" alt="Logo" style={{ width: 150, marginBottom: "2rem" }} />

      {/* GLOBAL */}
      {isGlobalCard && winner && owner && (
        <div className={styles.fasitCard} style={{ maxWidth: 500, margin: "0 auto" }}>
          <h2>{name}</h2>
          <p><b>🍺 Beste øl:</b> {winningBeer.correct.name}</p>
          <p><b>🏆 Vinner:</b> {winner.split(" ")[0]}</p>
          <p><b>🧠 Arrangør:</b> {owner.split(" ")[0]}</p>
          <p><b>😍 Likte ølet:</b>
            {analysis.global.highestRaters
            .map(r => ` ${r.name.split(" ")[0]} (${r.avg.toFixed(2)})`)
            .join(", ")}
          </p>
          <p><b>😞 Var litt kritisk:</b>
            {analysis.global.lowestRaters
            .map(r => ` ${r.name.split(" ")[0]} (${r.avg.toFixed(2)})`)
            .join(", ")}
          </p>
        </div>
      )}

      {/* ØLKORT */}
      {!isGlobalCard && beer && (
        <div
          className={styles.fasitCard}
          style={{
            margin: "0 auto",
            maxWidth: 500,
            opacity: animating ? 0 : 1,
            transform: animating ? "translateX(20px)" : "translateX(0)",
            transition: "all 0.2s ease",
            textAlign: "left",
          }}
        >
          {(() => {
            const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🍺";
            const summary = buildBeerSummaryText({ beer, rank, facts, analysis });

            return (
              <>
                {/* OVERSKRIFT */}
                <h3
                  style={{
                    marginBottom: "1rem",
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>{medal}</span>
                  <span>{summary.title}</span>
                </h3>

                {/* LINJER */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {summary.body.map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        alignItems: "flex-start",
                        padding: "0.4rem 0",
                        borderBottom:
                          i < summary.body.length - 1
                            ? "1px dashed rgba(255,255,255,0.15)"
                            : "none",
                      }}
                    >
                      <span
                        style={{
                          ...iconStyle(row.icon),
                          transition: "transform 0.2s ease",
                        }}
                      >
                        {row.icon}
                      </span>
                      <span>{row.text}</span>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* NAV */}
      <div style={{ marginTop: "2rem" }}>
        <button onClick={() => changeIndex(-1)}>◀</button>
        <span style={{ margin: "0 1rem" }}>
          {index + 1} / {totalSlides}
        </span>
        <button onClick={() => changeIndex(1)}>▶</button>
      </div>
    </section>
  );
}
