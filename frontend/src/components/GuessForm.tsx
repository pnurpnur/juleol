"use client";

import { useEffect, useState } from "react";

export default function GuessForm({ eventId, userId }) {
  const [beers, setBeers] = useState([]);
  const [options, setOptions] = useState([]);
  const [abvRanges, setAbvRanges] = useState([]);
  const [types, setTypes] = useState([]);

  const [answers, setAnswers] = useState({});

  useEffect(() => {
    async function load() {
      const b = await fetch(`/api/events/${eventId}/beers`).then(r => r.json());
      const o = await fetch(`/api/events/${eventId}/beer-options`).then(r => r.json());
      const a = await fetch(`/api/events/${eventId}/abv-options`).then(r => r.json());
      const t = await fetch(`/api/types`).then(r => r.json());

      setBeers(b);
      setOptions(o);
      setAbvRanges(a);
      setTypes(t);
    }
    load();
  }, [eventId]);

  function updateAnswer(beerId, field, value) {
    setAnswers(prev => ({
      ...prev,
      [beerId]: { ...prev[beerId], [field]: value }
    }));
  }

  async function submitBeer(beerId) {
    const guess = answers[beerId];
    if (!guess) return alert("Fyll ut skjemaet først!");

    const payload = {
      user_id: userId,
      event_id: Number(eventId),
      beer_id: beerId,
      guessed_beer_option_id: Number(guess.guessed_beer),
      guessed_abv_range_id: Number(guess.guessed_abv_range),
      guessed_type_id: Number(guess.guessed_type),
      rating: Number(guess.rating),
    };

    console.log("Submit:", payload);

    const res = await fetch("/api/guesses", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    alert("Registrert!");
  }

  if (!beers.length) return <div>Laster...</div>;

  return (
    <div className="p-6 space-y-12">
      <h1 className="text-2xl font-bold">Juleølsmaking</h1>

      {beers.map((beer, index) => (
        <div key={beer.id} className="p-4 border rounded-lg space-y-4">
          <h2 className="text-xl font-semibold">Øl #{index + 1}</h2>

          {/* Guess beer */}
          <div>
            <label className="block font-medium mb-1">Hvilken øl?</label>
            <select
              className="border p-2 rounded w-full"
              onChange={e =>
                updateAnswer(beer.id, "guessed_beer", e.target.value)
              }
            >
              <option value="">Velg øl</option>
              {options.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* ABV */}
          <div>
            <label className="block font-medium mb-1">Styrke</label>
            <select
              className="border p-2 rounded w-full"
              onChange={e =>
                updateAnswer(beer.id, "guessed_abv_range", e.target.value)
              }
            >
              <option value="">Velg styrke</option>
              {abvRanges.map(r => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block font-medium mb-1">Type</label>
            <select
              className="border p-2 rounded w-full"
              onChange={e =>
                updateAnswer(beer.id, "guessed_type", e.target.value)
              }
            >
              <option value="">Velg type</option>
              {types.map(t => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="block font-medium mb-1">Karakter (1–10)</label>
            <input
              type="number"
              min="1"
              max="10"
              className="border p-2 rounded w-full"
              onChange={e =>
                updateAnswer(beer.id, "rating", e.target.value)
              }
            />
          </div>

          <button
            onClick={() => submitBeer(beer.id)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Send inn for denne ølen
          </button>
        </div>
      ))}
    </div>
  );
}
