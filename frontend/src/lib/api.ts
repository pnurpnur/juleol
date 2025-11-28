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
// Events
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
// Guessing (new nested API)
///////////////////////////////////////////////////////////////

// GET one guess
export function getGuess(eventId: number, beerId: number, userId: string) {
  return apiGet(
    `/api/events/${eventId}/beer/${beerId}/guess?user_id=${userId}`
  );
}

// POST create/update guess
export function submitGuess(data: {
  event_id: number;
  beer_id: number;
  user_id: string;
  guessed_beer_option_id?: number | null;
  guessed_abv_range_id?: number | null;
  guessed_type_id?: number | null;
}) {
  const { event_id, beer_id, ...payload } = data;

  return apiPost(
    `/api/events/${event_id}/beer/${beer_id}/guess?user_id=${data.user_id}`,
    payload
  );
}

///////////////////////////////////////////////////////////////
// Ratings (new nested API)
///////////////////////////////////////////////////////////////

export function getRating(eventId: number, beerId: number, userId: string) {
  return apiGet(
    `/api/events/${eventId}/beer/${beerId}/rating?user_id=${userId}`
  );
}

export function submitRating(data: {
  event_id: number;
  beer_id: number;
  user_id: string;
  rating: number;
  untappd_score?: number | null;
}) {
  const { event_id, beer_id, ...payload } = data;

  return apiPost(
    `/api/events/${event_id}/beer/${beer_id}/rating?user_id=${data.user_id}`,
    payload
  );
}

///////////////////////////////////////////////////////////////
// Admin
///////////////////////////////////////////////////////////////

export function createEvent(name: string, userId: string) {
  return apiPost("/api/create-event", { name, user_id: userId });
}

export function closeEvent(eventId: number, userId: string) {
  return apiPost("/api/close-event", { event_id: eventId, user_id: userId });
}

///////////////////////////////////////////////////////////////
// Test utilities
///////////////////////////////////////////////////////////////

export function testDB() {
  return apiGet("/api/test-db");
}

export function testEnv() {
  return apiGet("/api/test-env");
}
