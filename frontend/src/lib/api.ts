// src/lib/api.ts

export async function apiGet(path: string) {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost(path: string, body: any) {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* -------------------------------------------------------------
   GUESSES
------------------------------------------------------------- */

export function submitGuess(data: {
  event_id: number;
  beer_id: number;
  guessed_beer_option_id?: number | null;
  guessed_abv_range_id?: number | null;
  guessed_type_id?: number | null;
}) {
  return apiPost("/api/guess", data);
}

export function fetchGuess(eventId: number, beerId: number) {
  return apiGet(`/api/guess?event_id=${eventId}&beer_id=${beerId}`);
}

export function fetchGuesses(eventId: number) {
  return apiGet(`/api/guesses?event_id=${eventId}`);
}

/* -------------------------------------------------------------
   RATINGS
------------------------------------------------------------- */

export function submitRating(data: {
  event_id: number;
  beer_id: number;
  rating: number;
  untappd_score?: number | null;
}) {
  return apiPost("/api/rating", data);
}

export function fetchRating(eventId: number, beerId: number) {
  return apiGet(`/api/rating?event_id=${eventId}&beer_id=${beerId}`);
}

export function fetchRatings(eventId: number) {
  return apiGet(`/api/ratings?event_id=${eventId}`);
}
