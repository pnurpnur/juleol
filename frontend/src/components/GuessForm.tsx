"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./GuessForm.module.css";

export default function GuessForm({
  eventId,
  beerId,
  beerOptions,
  abvRanges,
  types,
  initialGuess,
  userId,
  totalBeers
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    guessed_beer_option_id: initialGuess?.guessed_beer_option_id || "",
    guessed_abv_range_id: initialGuess?.guessed_abv_range_id || "",
    guessed_type_id: initialGuess?.guessed_type_id || "",
    rating: initialGuess?.rating || 5,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Auto-save with debounce
  const save = useCallback(async () => {
    setSaving(true);
    setSaved(false);

    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/submit_guess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        event_id: eventId,
        beer_id: beerId,
        ...form,
      }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [form, beerId, eventId, userId]);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => {
      save();
    }, 800);

    return () => clearTimeout(t);
  }, [form, save]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Navigation
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

  return (
    <div className={styles.wrapper}>

      <h2 className={styles.title}>Øl {beerId} av {totalBeers}</h2>

      {saving && <div className={styles.saving}>Lagrer...</div>}
      {saved && <div className={styles.saved}>Lagret ✓</div>}

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
