// src/lib/api.ts

///////////////////////////////////////////////////////////////
// Fetch helpers
///////////////////////////////////////////////////////////////

async function apiGet(url: string) {
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${url} failed: ${text}`);
  }

  return res.json();
}

async function apiPost(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${url} failed: ${text}`);
  }

  return res.json();
}

///////////////////////////////////////////////////////////////
// Event list
///////////////////////////////////////////////////////////////

export function getEvents() {
  return apiGet("/api/events");
}

export function getEventBeerOptions(eventId: number) {
  return apiGet(`/api/events/${eventId}/beer-options`);
}

export function getEventABVRanges(eventId: number) {
  return apiGet(`/api/events/${eventId}/abv-options`);
}

export function getTypes() {
  return apiGet("/api/types");
}

///////////////////////////////////////////////////////////////
// Guessing
///////////////////////////////////////////////////////////////

export function getGuess(eventId: number, beerId: number, userId: string) {
  return apiGet(
    `/api/guess?event_id=${eventId}&beer_id=${beerId}&user_id=${userId}`
  );
}

export function getGuesses(eventId: number, userId: string) {
  return apiGet(`/api/guesses?event_id=${eventId}&user_id=${userId}`);
}

export function submitGuess(data: {
  event_id: number;
  beer_id: number;
  user_id: string;
  guessed_beer_option_id?: number | null;
  guessed_abv_range_id?: number | null;
  guessed_type_id?: number | null;
}) {
  return apiPost(`/api/guess`, data);
}

///////////////////////////////////////////////////////////////
// Ratings
///////////////////////////////////////////////////////////////

export function getRating(eventId: number, beerId: number, userId: string) {
  return apiGet(
    `/api/rating?event_id=${eventId}&beer_id=${beerId}&user_id=${userId}`
  );
}

export function getRatings(eventId: number) {
  return apiGet(`/api/ratings?event_id=${eventId}`);
}

export function submitRating(data: {
  event_id: number;
  beer_id: number;
  user_id: string;
  rating: number;
  untappd_score?: number | null;
}) {
  return apiPost(`/api/rating`, data);
}

///////////////////////////////////////////////////////////////
// Admin actions
///////////////////////////////////////////////////////////////

export function closeEvent(eventId: number) {
  return apiPost("/api/close-event", { event_id: eventId });
}

///////////////////////////////////////////////////////////////
// Test/debug utilities
///////////////////////////////////////////////////////////////

export function testDB() {
  return apiGet("/api/test-db");
}

export function testEnv() {
  return apiGet("/api/test-env");
}
