package api

import (
    "encoding/json"
    "net/http"
)

func GetGuess(w http.ResponseWriter, r *http.Request) {
    eventID := r.URL.Query().Get("event_id")
    beerID := r.URL.Query().Get("beer_id")
    userID := r.URL.Query().Get("user_id")

    if eventID == "" || beerID == "" || userID == "" {
        http.Error(w, "Missing parameters", 400)
        return
    }

    db, err := DB()
    if err != nil {
        http.Error(w, "DB error: "+err.Error(), 500)
        return
    }

    var guess struct {
        EventID            int
        UserID             string
        BeerID             int
        BeerOptionID       *int
        ABVRangeID         *int
        TypeID             *int
        CreatedAt          string
    }

    err = db.QueryRow(`
        SELECT
            event_id,
            user_id,
            beer_id,
            guessed_beer_option_id,
            guessed_abv_range_id,
            guessed_type_id,
            created_at
        FROM guesses
        WHERE event_id = ? AND beer_id = ? AND user_id = ?
    `, eventID, beerID, userID).
        Scan(&guess.EventID, &guess.UserID, &guess.BeerID,
            &guess.BeerOptionID, &guess.ABVRangeID, &guess.TypeID,
            &guess.CreatedAt)

    if err != nil {
        // Return null instead of error → frontend handles gracefully
        w.Write([]byte("null"))
        return
    }

    // CamelCase JSON to match frontend types.ts
    out := map[string]any{
        "eventId":            guess.EventID,
        "userId":             guess.UserID,
        "beerId":             guess.BeerID,
        "guessedBeerOptionId": guess.BeerOptionID,
        "guessedAbvRangeId":   guess.ABVRangeID,
        "guessedTypeId":       guess.TypeID,
        "createdAt":           guess.CreatedAt,
    }

    json.NewEncoder(w).Encode(out)
}
