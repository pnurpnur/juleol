"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
// use plain <img> to avoid next/image runtime DOM manipulation during debugging
// import Image from "next/image";
import styles from "./GuessForm.module.css";

interface GuessFormProps {
  eventId: number;
  beerId: number;
  beerOptions: { id: number; name: string }[];
  abvRanges: { id: number; label: string }[];
  types: { id: number; name: string }[];
  initialGuess?: any;
  initialRating?: any;
  userId: number;
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
    setSaved(false);

    try {
      // Save guess
      await fetch(`/api/events/${eventId}/beer/${beerId}/guess`, {
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
      await fetch(`/api/events/${eventId}/beer/${beerId}/rating`, {
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
  const goToBeer = (num: number) => {
    router.push(`/event/${eventId}/beer/${num}`);
  };

  const nextBeer = () => {
    const next = beerId < totalBeers ? beerId + 1 : 1;
    goToBeer(next);
  };

  const prevBeer = () => {
    const prev = beerId > 1 ? beerId - 1 : totalBeers;
    goToBeer(prev);
  };

  /////////////////////////////////////////////////////////////
  // Render
  /////////////////////////////////////////////////////////////
  return (
    <div className={styles.wrapper}>
      {/* Header with logo */}
      <header className={styles.header}>
        <div
          className={styles.logoContainer}
          onClick={() => router.push("/")}
          style={{ cursor: "pointer" }}
        >
          <img src="/logo.png" alt="Logo" width={150} height={150} />
        </div>
      </header>

      {/* Beer navigator circles */}
      <div className={styles.beerNavigator}>
        {Array.from({ length: totalBeers }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => goToBeer(num)}
            className={`${styles.beerButton} ${num === beerId ? styles.active : ""}`}
            title={`Øl ${num}`}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Form content */}
      <div className={styles.formContent}>
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
        <label className={styles.label}>Styrke</label>
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
        <label className={styles.label}>Stil</label>
        <select
          value={form.guessed_type_id}
          onChange={(e) => update("guessed_type_id", e.target.value)}
          className={styles.select}
        >
          <option value="">Velg stil</option>
          {types.map((t) => (
            <option key={t.id} value={String(t.id)}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Rating */}
        <label className={styles.label}>Din rating</label>
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min="1"
            max="10"
            value={form.rating}
            onChange={(e) => update("rating", e.target.value)}
            className={styles.slider}
          />
          <span className={styles.ratingValue}>{form.rating}/10</span>
        </div>

        {/* Untappd score */}
        <label className={styles.label}>Untappd score (valgfritt)</label>
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={form.untappd_score}
            onChange={(e) => update("untappd_score", e.target.value)}
            className={styles.slider}
          />
          <span className={styles.ratingValue}>{form.untappd_score || "0"}/5</span>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className={styles.navButtons}>
        <button onClick={prevBeer} className={styles.navButton}>
          ← Forrige
        </button>
        <button onClick={nextBeer} className={styles.navButton}>
          Neste →
        </button>
      </div>
    </div>
  );
}
