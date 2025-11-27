"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./GuessForm.module.css";

export default function GuessForm({
  eventId,
  beerId,
  beerOptions,
  abvRanges,
  types,
  initialGuess,
  initialRating,
  userId,
  totalBeers
}) {
  //
  // ----- Initial Form State -----
  //
  const [guessForm, setGuessForm] = useState({
    guessed_beer_option_id: initialGuess?.guessedBeerOptionId || "",
    guessed_abv_range_id: initialGuess?.guessedAbvRangeId || "",
    guessed_type_id: initialGuess?.guessedTypeId || "",
  });

  const [ratingForm, setRatingForm] = useState({
    rating: initialRating?.rating ?? 5,
    untappd_score: initialRating?.untappdScore ?? "",
  });

  //
  // ----- Save states -----
  //
  const [guessSaving, setGuessSaving] = useState(false);
  const [guessSaved, setGuessSaved] = useState(false);

  const [ratingSaving, setRatingSaving] = useState(false);
  const [ratingSaved, setRatingSaved] = useState(false);

  //
  // ----- Save Guess -----
  //
  const saveGuess = useCallback(async () => {
    setGuessSaving(true);
    setGuessSaved(false);

    await fetch("/api/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        beer_id: beerId,
        user_id: userId,
        ...guessForm,
      }),
    });

    setGuessSaving(false);
    setGuessSaved(true);
    setTimeout(() => setGuessSaved(false), 1500);
  }, [guessForm, eventId, beerId, userId]);

  //
  // ----- Save Rating -----
  //
  const saveRating = useCallback(async () => {
    setRatingSaving(true);
    setRatingSaved(false);

    await fetch("/api/rating", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        beer_id: beerId,
        user_id: userId,
        ...ratingForm,
      }),
    });

    setRatingSaving(false);
    setRatingSaved(true);
    setTimeout(() => setRatingSaved(false), 1500);
  }, [ratingForm, eventId, beerId, userId]);

  //
  // ----- Debounce both -----
  //
  useEffect(() => {
    const t = setTimeout(saveGuess, 500);
    return () => clearTimeout(t);
  }, [guessForm, saveGuess]);

  useEffect(() => {
    const t = setTimeout(saveRating, 500);
    return () => clearTimeout(t);
  }, [ratingForm, saveRating]);

  //
  // ----- Update Helper -----
  //
  function updateGuess(key, value) {
    setGuessForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateRating(key, value) {
    setRatingForm((prev) => ({ ...prev, [key]: value }));
  }

  //
  // ----- UI -----
  //
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Øl {beerId} av {totalBeers}</h2>

      {/* Saving indicators */}
      {guessSaving && <div className={styles.saving}>Lagrer gjetning…</div>}
      {guessSaved && <div className={styles.saved}>Gjetning lagret ✓</div>}

      {ratingSaving && <div className={styles.saving}>Lagrer rating…</div>}
      {ratingSaved && <div className={styles.saved}>Rating lagret ✓</div>}

      {/* GUESS SECTION */}
      <label className={styles.label}>Hvilken øl tror du det er?</label>
      <select
        value={guessForm.guessed_beer_option_id}
        onChange={(e) => updateGuess("guessed_beer_option_id", Number(e.target.value))}
        className={styles.select}
      >
        <option value="">Velg øl</option>
        {beerOptions.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>

      <label className={styles.label}>Hvilken styrke?</label>
      <select
        value={guessForm.guessed_abv_range_id}
        onChange={(e) => updateGuess("guessed_abv_range_id", Number(e.target.value))}
        className={styles.select}
      >
        <option value="">Velg styrke</option>
        {abvRanges.map((a) => (
          <option key={a.id} value={a.id}>{a.label}</option>
        ))}
      </select>

      <label className={styles.label}>Hvilken type øl?</label>
      <select
        value={guessForm.guessed_type_id}
        onChange={(e) => updateGuess("guessed_type_id", Number(e.target.value))}
        className={styles.select}
      >
        <option value="">Velg type</option>
        {types.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      {/* RATING SECTION */}
      <label className={styles.label}>Hvor godt likte du den?</label>
      <input
        type="range"
        min="1"
        max="10"
        value={ratingForm.rating}
        onChange={(e) => updateRating("rating", Number(e.target.value))}
        className={styles.slider}
      />
      <div className={styles.ratingValue}>{ratingForm.rating}/10</div>

      <label className={styles.label}>Untappd score (valgfri 0–5)</label>
      <input
        type="number"
        min="0"
        max="5"
        step="0.1"
        value={ratingForm.untappd_score}
        onChange={(e) => updateRating("untappd_score", e.target.value)}
        className={styles.input}
        placeholder="Eks: 3.75"
      />
    </div>
  );
}
