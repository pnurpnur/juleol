"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./GuessForm.module.css";

interface GuessFormProps {
  eventId: number;
  beerId: number;
  beerOptions: { id: number; name: string }[];
  abvRanges: { id: number; label: string }[];
  types: { id: number; name: string }[];
  initialGuess?: any;
  initialRating?: any;
  userId: string;
  totalBeers: number;
}

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
}: GuessFormProps) {
  const router = useRouter();

  const [form, setForm] = useState({
    guessed_beer_option_id: "",
    guessed_abv_range_id: "",
    guessed_type_id: "",
    rating: 5,
    untappd_score: "",
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /////////////////////////////////////////////////////////////
  // Initialize form safely with camelCase & snake_case support
  /////////////////////////////////////////////////////////////
  useEffect(() => {
    setForm((prev) => ({
      guessed_beer_option_id:
        initialGuess?.guessedBeerOptionId ??
        initialGuess?.guessed_beer_option_id ??
        prev.guessed_beer_option_id ??
        "",
      guessed_abv_range_id:
        initialGuess?.guessedAbvRangeId ??
        initialGuess?.guessed_abv_range_id ??
        prev.guessed_abv_range_id ??
        "",
      guessed_type_id:
        initialGuess?.guessedTypeId ??
        initialGuess?.guessed_type_id ??
        prev.guessed_type_id ??
        "",
      rating:
        initialRating?.rating ??
        initialRating?.score ??
        prev.rating ??
        5,
      untappd_score:
        initialRating?.untappdScore ??
        initialRating?.untappd_score ??
        prev.untappd_score ??
        "",
    }));
    setIsInitialized(true);
  }, [beerId, initialGuess, initialRating]);

  /////////////////////////////////////////////////////////////
  // Update form state
  /////////////////////////////////////////////////////////////
  const update = (field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: field === "rating" ? Number(value) : value,
    }));
  };

  /////////////////////////////////////////////////////////////
  // Autosave
  /////////////////////////////////////////////////////////////
  const save = useCallback(async () => {
    if (!isInitialized) return;
    setSaving(true);
    setSaved(false);

    try {
      // Save guess
      await fetch(`/api/events/${eventId}/beer/${beerId}/guess?user_id=${userId}`, {
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
      });

      // Save rating
      await fetch(`/api/events/${eventId}/beer/${beerId}/rating?user_id=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          rating: form.rating,
          untappd_score: form.untappd_score === "" ? null : Number(form.untappd_score),
        }),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      console.error("Autosave error:", err);
    } finally {
      setSaving(false);
    }
  }, [form, eventId, beerId, userId, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    const t = setTimeout(() => save(), 800);
    return () => clearTimeout(t);
  }, [form, save, isInitialized]);

  /////////////////////////////////////////////////////////////
  // Navigation
  /////////////////////////////////////////////////////////////
  const nextBeer = () => {
    if (beerId < totalBeers) router.push(`/event/${eventId}/beer/${beerId + 1}`);
  };

  const prevBeer = () => {
    if (beerId > 1) router.push(`/event/${eventId}/beer/${beerId - 1}`);
  };

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

      {/* Guess: Beer */}
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

      {/* Guess: ABV */}
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

      {/* Guess: Type */}
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

      {/* Rating */}
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

      {/* Untappd */}
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
