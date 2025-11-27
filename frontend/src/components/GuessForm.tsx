"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./GuessForm.module.css";
import { submitGuess, submitRating } from "@/lib/api";

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
  const router = useRouter();

  // ------------------------------------------------------------
  // FORM STATE
  // ------------------------------------------------------------
  const [form, setForm] = useState({
    guessed_beer_option_id: initialGuess?.guessed_beer_option_id || "",
    guessed_abv_range_id: initialGuess?.guessed_abv_range_id || "",
    guessed_type_id: initialGuess?.guessed_type_id || "",
    rating: initialRating?.rating ?? 5,
    untappd_score: initialRating?.untappd_score ?? ""
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ------------------------------------------------------------
  // SAVE (debounced)
  // ------------------------------------------------------------
  const save = useCallback(async () => {
    setSaving(true);
    setSaved(false);

    try {
      // save guess
      await submitGuess({
        event_id: eventId,
        beer_id: beerId,
        guessed_beer_option_id: form.guessed_beer_option_id || null,
        guessed_abv_range_id: form.guessed_abv_range_id || null,
        guessed_type_id: form.guessed_type_id || null,
      });

      // save rating
      await submitRating({
        event_id: eventId,
        beer_id: beerId,
        rating: form.rating,
        untappd_score: form.untappd_score === "" ? null : Number(form.untappd_score),
      });
    } catch (err) {
      console.error("Save error", err);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [form, eventId, beerId]);

  // Debounce 800ms
  useEffect(() => {
    const t = setTimeout(save, 800);
    return () => clearTimeout(t);
  }, [form, save]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // ------------------------------------------------------------
  // NAVIGATION
  // ------------------------------------------------------------
  function goNext() {
    if (beerId < totalBeers) {
      router.push(`/event/${eventId}/beer/${beerId + 1}`);
    }
  }

  function goPrev() {
    if (beerId > 1) {
      router.push(`/event/${eventId}/beer/${beerId - 1}`);
    }
  }

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className={styles.wrapper}>

      <h2 className={styles.title}>Øl {beerId} av {totalBeers}</h2>

      {saving && <div className={styles.saving}>Lagrer...</div>}
      {saved && <div className={styles.saved}>Lagret ✓</div>}

      {/* GUESS: ØL */}
      <label className={styles.label}>Hvilken øl tror du det er?</label>
      <select
        value={form.guessed_beer_option_id}
        onChange={(e) => update("guessed_beer_option_id", e.target.value)}
        className={styles.select}
      >
        <option value="">Velg øl</option>
        {beerOptions.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>

      {/* GUESS: ABV */}
      <label className={styles.label}>Hvilken styrke?</label>
      <select
        value={form.guessed_abv_range_id}
        onChange={(e) => update("guessed_abv_range_id", e.target.value)}
        className={styles.select}
      >
        <option value="">Velg styrke</option>
        {abvRanges.map((a) => (
          <option key={a.id} value={a.id}>{a.label}</option>
        ))}
      </select>

      {/* GUESS: TYPE */}
      <label className={styles.label}>Hvilken type øl?</label>
      <select
        value={form.guessed_type_id}
        onChange={(e) => update("guessed_type_id", e.target.value)}
        className={styles.select}
      >
        <option value="">Velg type</option>
        {types.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      {/* RATING */}
      <label className={styles.label}>Hvor godt likte du den?</label>
      <input
        type="range"
        min="1"
        max="10"
        value={form.rating}
        onChange={(e) => update("rating", Number(e.target.value))}
        className={styles.slider}
      />
      <div className={styles.ratingValue}>{form.rating}/10</div>

      {/* UNTAPPD SCORE */}
      <label className={styles.label}>Untappd-score (valgfritt 0–5)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        max="5"
        value={form.untappd_score}
        onChange={(e) => update("untappd_score", e.target.value)}
        className={styles.select}
        placeholder="F.eks 3.75"
      />

      {/* NAV */}
      <div className={styles.navButtons}>
        {beerId > 1 && (
          <button onClick={goPrev} className={styles.navButton}>← Forrige</button>
        )}
        {beerId < totalBeers && (
          <button onClick={goNext} className={styles.navButton}>Neste →</button>
        )}
      </div>

    </div>
  );
}
