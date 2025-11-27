// src/types.ts

///////////////////////////////////////////////////////////////
// Core Event Types
///////////////////////////////////////////////////////////////

export interface Event {
  id: number;
  name: string;
  isOpen: boolean;
  createdAt: string;
}

///////////////////////////////////////////////////////////////
// Beer objects for each event
///////////////////////////////////////////////////////////////

export interface BeerOption {
  id: number;
  eventId: number;
  name: string;
  brewery?: string | null;
  description?: string | null;
  untappdLink?: string | null;
}

export interface ABVRange {
  id: number;
  eventId: number;
  label: string; // "4.5–5.0%", etc.
}

export interface BeerType {
  id: number;
  name: string; // e.g. "IPA", "Stout"
}

///////////////////////////////////////////////////////////////
// Guess (comes from Go backend)
///////////////////////////////////////////////////////////////
//
// Note: guesses DO NOT include rating anymore.
// Rating is stored in `ratings` table.
//

export interface Guess {
  eventId: number;
  userId: string;
  beerId: number;

  guessedBeerOptionId?: number | null;
  guessedAbvRangeId?: number | null;
  guessedTypeId?: number | null;

  createdAt: string;
}

///////////////////////////////////////////////////////////////
// Rating (from `ratings` table)
///////////////////////////////////////////////////////////////

export interface Rating {
  eventId: number;
  userId: string;
  beerId: number;

  rating: number; // 0–10
  untappdScore?: number | null; // 0–5

  createdAt: string;
}

///////////////////////////////////////////////////////////////
// Aggregated/utility types for frontend
///////////////////////////////////////////////////////////////

export interface BeerWithGuessAndRating {
  beerId: number;
  guess?: Guess | null;
  rating?: Rating | null;
}

export interface SelectOption {
  id: number;
  label: string;
}

///////////////////////////////////////////////////////////////
// Payloads for API calls
///////////////////////////////////////////////////////////////

export interface SubmitGuessInput {
  event_id: number;
  user_id: string;
  beer_id: number;
  guessed_beer_option_id?: number | null;
  guessed_abv_range_id?: number | null;
  guessed_type_id?: number | null;
}

export interface SubmitRatingInput {
  event_id: number;
  user_id: string;
  beer_id: number;
  rating: number;
  untappd_score?: number | null;
}
