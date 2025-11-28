"use client";

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
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
  totalBeers,
}) {
  const router = useRouter();

  /////////////////////////////////////////////////////////////
  // Internal form state
  /////////////////////////////////////////////////////////////

  const [form, setForm] = useState({
    guessed_beer_option_id: "",
    guessed_abv_range_id: "",
    guessed_type_id: "",
    rating: 5,
    untappd_score: "",
  });

  // Track if we're currently loading initial data
  const [isInitialized, setIsInitialized] = useState(false);

  /////////////////////////////////////////////////////////////
  // Initialize form when initialGuess / initialRating arrives
  /////////////////////////////////////////////////////////////

  useLayoutEffect(() => {
    // Exit if there's nothing to load yet
    if (!initialGuess && !initialRating) return;

    console.log("GuessForm init:", { initialGuess, initialRating, beerOptions });

    // Accept both camelCase and snake_case shapes from props (guesses)
    const guessedBeerOptionId =
      initialGuess?.guessedBeerOptionId ?? initialGuess?.guessed_beer_option_id ?? null;
    const guessedAbvRangeId =
      initialGuess?.guessedAbvRangeId ?? initialGuess?.guessed_abv_range_id ?? null;
    const guessedTypeId =
      initialGuess?.guessedTypeId ?? initialGuess?.guessed_type_id ?? null;

    // Accept both camelCase and snake_case for rating payload
    const loadedRating =
      initialRating?.rating ?? initialRating?.score ?? null;
    const loadedUntappd =
      initialRating?.untappdScore ?? initialRating?.untappd_score ?? "";

    // set synchronously so inputs/selects render with the loaded values
    setForm({
      guessed_beer_option_id: guessedBeerOptionId != null ? String(guessedBeerOptionId) : "",
      guessed_abv_range_id: guessedAbvRangeId != null ? String(guessedAbvRangeId) : "",
      guessed_type_id: guessedTypeId != null ? String(guessedTypeId) : "",
      // ensure rating is numeric in-state
      rating: loadedRating != null ? Number(loadedRating) : 5,
      untappd_score: loadedUntappd !== null ? String(loadedUntappd) : "",
    });

    setIsInitialized(true);
  }, [
    beerId,
    initialGuess ?? null,
    (initialRating?.rating ?? initialRating?.score ?? null),
    beerOptions ? beerOptions.length : 0,
  ]);

  /////////////////////////////////////////////////////////////
  // Updates
  /////////////////////////////////////////////////////////////

  const numericFields = [
    "rating",
  ];

  function update(field: string, value: any) {
    setForm((prev) => ({
      ...prev,
      // keep select fields as strings; only rating is numeric in-state
      [field]: field === "rating" ? Number(value) : value,
    }));
  }

  /////////////////////////////////////////////////////////////
  // Autosave logic
  /////////////////////////////////////////////////////////////

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = useCallback(async () => {
    setSaving(true);
    setSaved(false);

    //---------------------------------------------------------
    // Save Guess
    //---------------------------------------------------------
    await fetch(
      `/api/events/${eventId}/beer/${beerId}/guess?user_id=${userId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          guessed_beer_option_id:
            form.guessed_beer_option_id === "" ? null : Number(form.guessed_beer_option_id),
          guessed_abv_range_id:
            form.guessed_abv_range_id === "" ? null : Number(form.guessed_abv_range_id),
          guessed_type_id:
            form.guessed_type_id === "" ? null : Number(form.guessed_type_id),
        }),
      }
    );

    //---------------------------------------------------------
    // Save Rating
    //---------------------------------------------------------
    await fetch(
      `/api/events/${eventId}/beer/${beerId}/rating?user_id=${userId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          rating: form.rating,
          untappd_score:
            form.untappd_score === "" ? null : Number(form.untappd_score),
        }),
      }
    );

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [form, eventId, beerId, userId]);

  // Skip autosave if form still has default/empty values
  useEffect(() => {
    if (!isInitialized) return;
    if (form.rating === 5 && form.guessed_beer_option_id === "") return;

    const t = setTimeout(() => save(), 800);
    return () => clearTimeout(t);
  }, [form, save, isInitialized]);

  /////////////////////////////////////////////////////////////
  // Navigation
  /////////////////////////////////////////////////////////////

  function nextBeer() {
    if (beerId < totalBeers) {
      router.push(`/event/${eventId}/beer/${beerId + 1}`);
    }
  }

  function prevBeer() {
    if (beerId > 1) {
      router.push(`/event/${eventId}/beer/${beerId - 1}`);
    }
  }

  /////////////////////////////////////////////////////////////
  // Render
  /////////////////////////////////////////////////////////////

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>
        Øl {beerId} av {totalBeers}
      </h2>

      {saving && <div className={styles.saving}>Lagrer…</div>}
      {saved && <div className={styles.saved}>Lagret ✓</div>}

      {/* GUESS: Which beer */}
      <label className={styles.label}>Hvilken øl tror du det er?</label>
      <select
        value={form.guessed_beer_option_id}
        onChange={(e) => update("guessed_beer_option_id", e.target.value)}
        className={styles.select}
      >
        <option value="">Velg øl</option>
        {beerOptions.map((o) => (
          <option key={o.id} value={String(o.id)}>
            {o.name}
          </option>
        ))}
      </select>

      {/* GUESS: ABV */}
      <select
        value={form.guessed_abv_range_id}
        onChange={(e) => update("guessed_abv_range_id", e.target.value)}
        className={styles.select}
      >
        <option value="">Velg styrke</option>
        {abvRanges.map((a) => (
          <option key={a.id} value={String(a.id)}>
            {a.label}
          </option>
        ))}
      </select>

      {/* GUESS: Type */}
      <select
        value={form.guessed_type_id}
        onChange={(e) => update("guessed_type_id", e.target.value)}
        className={styles.select}
      >
        <option value="">Velg type</option>
        {types.map((t) => (
          <option key={t.id} value={String(t.id)}>
            {t.name}
          </option>
        ))}
      </select>

      {/* RATING: Score */}
      <label className={styles.label}>Din rating</label>
      <input
        type="range"
        min="1"
        max="10"
        value={form.rating}
        onChange={(e) => update("rating", e.target.value)}
        className={styles.slider}
      />
      <div className={styles.ratingValue}>{form.rating}/10</div>

      {/* RATING: Untappd */}
      <label className={styles.label}>Untappd score (valgfritt)</label>
      <input
        type="number"
        min="0"
        max="5"
        step="0.25"
        value={form.untappd_score}
        onChange={(e) => update("untappd_score", e.target.value)}
        className={styles.input}
      />

      {/* Navigation */}
      <div className={styles.navButtons}>
        {beerId > 1 && (
          <button onClick={prevBeer} className={styles.navButton}>
            ← Forrige
          </button>
        )}
        {beerId < totalBeers && (
          <button onClick={nextBeer} className={styles.navButton}>
            Neste →
          </button>
        )}
      </div>
    </div>
  );
}
