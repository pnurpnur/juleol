"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./ResultsClient.module.css";

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

// --- ANALYSE-FUNKSJON ---
function analyzeBeers(beers: BeerSummary[]) {
  /* -------------------------
     ØL-SPESIFIKKE FAKTA
     (basert på summary)
  -------------------------- */

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
      }
    };
  });

  /* -------------------------
     GLOBALE FAKTA
  -------------------------- */

  // Snitt-rating per deltaker
  const ratingMap: Record<string, number[]> = {};

  beers.forEach(b =>
    b.participants.forEach(p => {
      if (!ratingMap[p.name]) ratingMap[p.name] = [];
      ratingMap[p.name].push(p.rating);
    })
  );

  const averages = Object.entries(ratingMap).map(([name, ratings]) => ({
    name,
    avg: ratings.reduce((a,b)=>a+b,0) / ratings.length
  }));

  const highestAvg = Math.max(...averages.map(a => a.avg));
  const lowestAvg = Math.min(...averages.map(a => a.avg));

  const highestRaters = averages.filter(a => a.avg === highestAvg);
  const lowestRaters = averages.filter(a => a.avg === lowestAvg);

  // Mørk vs IPA
  const darkStyles = ["Stout", "Barleywine", "Bock"];
  const ipaStyles = ["IPA"];
  const preference: Record<string, number> = {};

  beers.forEach(beer =>
    beer.participants.forEach(p => {
      if (!preference[p.name]) preference[p.name] = 0;
      if (darkStyles.includes(beer.correct.type)) preference[p.name] += p.rating;
      if (ipaStyles.includes(beer.correct.type)) preference[p.name] -= p.rating;
    })
  );

  const likesDarkMost = Object.entries(preference).sort((a,b)=>b[1]-a[1])[0];
  const likesIPAMost = Object.entries(preference).sort((a,b)=>a[1]-b[1])[0];

  // Mest uenig øl (std dev)
  const stdDev = (arr: number[]) => {
    const mean = arr.reduce((a,b)=>a+b,0)/arr.length;
    return Math.sqrt(arr.reduce((a,b)=>a+(b-mean)**2,0)/arr.length);
  };

  const mostDisagreedBeer = beers
    .map(b => ({
      beerId: b.beer_id,
      sd: stdDev(b.participants.map(p => p.rating))
    }))
    .sort((a,b)=>b.sd - a.sd)[0];

  return {
    perBeerFacts,
    global: {
      highestRaters,
      lowestRaters,
      likesDarkMost,
      likesIPAMost,
      mostDisagreedBeer
    }
  };
}

export default function EventSummary({ eventId }: { eventId: number }) {
  const [data, setData] = useState<EventSummaryResponse | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/event_summary?event_id=${eventId}`);
      if (!res.ok) return;
      setData(await res.json());

      // Hent owner fra feed
      const ownerRes = await fetch(`/api/events/${eventId}`);
      if (ownerRes.ok) {
        const ownerJson = await ownerRes.json();
        setOwner(ownerJson.owner_name);
      }

      // Hent vinner
      const winnerRes = await fetch(`/api/leaderboard?event_id=${eventId}`);
      if (winnerRes.ok) {
        const winnerJson = await winnerRes.json();
        if (Array.isArray(winnerJson.standings) && winnerJson.standings.length > 0) {
          setWinner(winnerJson.standings[0].userName);
        }
      }
    }
    load();
  }, [eventId]);

  const beers = data?.beers ?? [];
  const analysis = beers.length ? analyzeBeers(beers) : null;

  const isGlobalCard = index === 0;
  const beer = !isGlobalCard ? beers[index - 1] : null;
  const totalSlides = beers.length + 1;

  const changeIndex = useCallback(
    (delta: number) => {
      if (!totalSlides) return;
      setAnimating(true);
      setTimeout(() => {
        setIndex((i) => (i + delta + totalSlides) % totalSlides);
        setAnimating(false);
      }, 200);
    },
    [totalSlides]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") changeIndex(-1);
      if (e.key === "ArrowRight") changeIndex(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changeIndex]);

  if (!data) return <div>Laster oppsummering…</div>;

  const facts = beer ? analysis?.perBeerFacts.find(f => f.beerId === beer.beer_id) : null;
  const winningBeer = beers.slice().sort((a,b)=>b.average_rating - a.average_rating)[0];

  // --- RENDER ---
  return (
    <section style={{ padding: "2rem", textAlign: "center" }}>
      <img
        src="/logo.png"
        alt="Logo"
        style={{ width: "150px", marginBottom: "2rem" }}
      />

      {isGlobalCard && analysis && (
        <div className={styles.fasitCard} style={{ maxWidth: "500px", margin: "0 auto" }}>
          <div style={{ fontSize: "1.6rem", marginBottom: "1rem" }}>
            🏆 <strong>Oppsummering</strong>
          </div>

          {/* Vinnende øl */}
          <div className={styles.fasitRow}>
            <span>🍺 Beste øl:</span>
            <b>
              {winningBeer.correct.name}
            </b>
          </div>

          {/* Vinner */}
          <div className={styles.fasitRow}>
            <span>🥇 Vinner:</span>
            <b>{winner.split(" ")[0]}</b>
          </div>
          {/* Owner */}
          <div className={styles.fasitRow}>
            <span>👑 Arrangør:</span>
            <b>{owner.split(" ")[0]}</b>
          </div>

          <hr style={{ margin: "1rem 0" }} />

          {/* Fun facts */}
          <div className={styles.fasitRow}>
            <span>😄 Elsker øl:</span>
            <b>
              {analysis.global.highestRaters
                .map(r => `${r.name.split(" ")[0]} (${r.avg.toFixed(2)})`)
                .join(", ")}
            </b>
          </div>

          <div className={styles.fasitRow}>
            <span>😞 Liker ikke øl:</span>
            <b>
              {analysis.global.lowestRaters
                .map(r => `${r.name.split(" ")[0]} (${r.avg.toFixed(2)})`)
                .join(", ")}
            </b>
          </div>

        </div>
      )}

       {/* Ølkort */}
      {!isGlobalCard && beer && (
        <div
          className={styles.fasitCard}
          style={{
            margin: "0 auto",
            maxWidth: "500px",
            transition: "transform 0.2s ease, opacity 0.2s ease",
            transform: animating ? "translateX(20px)" : "translateX(0)",
            opacity: animating ? 0 : 1,
          }}
        >
          <div style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>
            <strong>#{beer.beer_id}</strong>
          </div>

          <div className={styles.fasitRow}>
            <span>🍺 Øl:</span>
            <b>{beer.correct.name}</b>
          </div>

          <div className={styles.fasitRow}>
            <span>🏷️ Type:</span> {beer.correct.type}
          </div>

          <div className={styles.fasitRow}>
            <span>🌡️ Styrke:</span> {beer.correct.abv}
          </div>

          <hr style={{ margin: "1rem 0" }} />

          <div className={styles.fasitRow}>
            <span>🍺 Gjennomsnittsrating:</span>{" "}
            {beer.average_rating !== null ? beer.average_rating.toFixed(2) : "–"}
          </div>

          <hr style={{ margin: "1rem 0" }} />

          <div className={styles.fasitRow}>
            <span>✅ Alle riktige:</span>
            <p className={styles.fasitData}>
              {beer.summary.all_correct.map(n => n.split(" ")[0]).join(", ") || "👎"}
            </p>
          </div>

          <div className={styles.fasitRow}>
            <span>❌ Alle feil:</span>
            <p className={styles.fasitData}>
              {beer.summary.all_wrong.map(n => n.split(" ")[0]).join(", ") || "👍"}
            </p>
          </div>

          {beer.summary.highest_rating.length > 0 && (
            <div className={styles.fasitRow}>
              <span>😄 Høyest rating:</span>
              <p className={styles.fasitData}>
                {beer.summary.highest_rating.map(r => r.name.split(" ")[0]).join(", ")} 
                {" "}({beer.summary.highest_rating[0].rating})
              </p>
            </div>
          )}

          {beer.summary.lowest_rating.length > 0 && (
            <div className={styles.fasitRow}>
              <span>😞 Lavest rating:</span>
              <p className={styles.fasitData}>
                {beer.summary.lowest_rating.map(r => r.name.split(" ")[0]).join(", ")} 
                {" "}({beer.summary.lowest_rating[0].rating})
              </p>
            </div>
          )}

          <hr style={{ margin: "1rem 0" }} />

          {facts?.beerGuess.correct === "one" && (
            <div className={styles.fasitRow}>
              <span>🎯 Kun én traff ølet:</span>
              <p className={styles.fasitData}>
                {facts.beerGuess.namesCorrect.map(n => n.split(" ")[0]).join(", ")}
              </p>
            </div>
          )}

          {facts?.beerGuess.correct === "all" && (
            <div className={styles.fasitRow}>
              <span>✅ Alle traff ølet</span>
            </div>
          )}

          {facts?.beerGuess.correct === "none" && (
            <div className={styles.fasitRow}>
              <span>❌ Ingen traff ølet</span>
            </div>
          )}

          {facts?.beerGuess.wrong === "one" && (
            <div className={styles.fasitRow}>
              <span>🤡 Bommet på ølet:</span>
              <p className={styles.fasitData}>
                {facts.beerGuess.namesWrong.map(n => n.split(" ")[0]).join(", ")}
              </p>
            </div>
          )}

          {facts?.typeGuess.correct === "one" && (
            <div className={styles.fasitRow}>
              <span>🎯 Kun én traff typen:</span>
              <p className={styles.fasitData}>
                {facts.typeGuess.namesCorrect.map(n => n.split(" ")[0]).join(", ")}
              </p>
            </div>
          )}

          {facts?.typeGuess.correct === "none" && (
            <div className={styles.fasitRow}>
              <span>❌ Ingen traff typen</span>
            </div>
          )}

          {facts?.typeGuess.wrong === "one" && (
            <div className={styles.fasitRow}>
              <span>🤡 Bommet på typen:</span>
              <p className={styles.fasitData}>
                {facts.typeGuess.namesWrong.map(n => n.split(" ")[0]).join(", ")}
              </p>
            </div>
          )}

          {facts?.abvGuess.correct === "one" && (
            <div className={styles.fasitRow}>
              <span>🌡️ Kun én traff styrken:</span>
              <p className={styles.fasitData}>
                {facts.abvGuess.namesCorrect.map(n => n.split(" ")[0]).join(", ")}
              </p>
            </div>
          )}

          {facts?.abvGuess.correct === "all" && (
            <div className={styles.fasitRow}>
              <span>✅ Alle traff styrken</span>
            </div>
          )}

          {facts?.abvGuess.correct === "none" && (
            <div className={styles.fasitRow}>
              <span>❌ Ingen traff styrken</span>
            </div>
          )}

          {facts?.abvGuess.wrong === "one" && (
            <div className={styles.fasitRow}>
              <span className={styles.fasitSpan}>🤡 Bommet på styrken:</span>
              <p className={styles.fasitData}>
                {facts.abvGuess.namesWrong.map(n => n.split(" ")[0]).join(", ")}
              </p>
            </div>
          )}

          {analysis.global.mostDisagreedBeer.beerId === beer.beer_id && (
            <div className={styles.fasitRow}>
              <span>🤯 Mest uenige om!</span>
              Standardavvik: {analysis.global.mostDisagreedBeer.sd.toPrecision(2)}
            </div>
          )}

        </div>
      )}

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
          {index + 1} / {totalSlides}
        </span>
        <button onClick={() => changeIndex(1)}>▶</button>
      </div>

    </section>
  );
}
