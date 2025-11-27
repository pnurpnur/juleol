package api

import (
    "encoding/json"
    "net/http"
)

func GetGuesses(w http.ResponseWriter, r *http.Request) {
    eventID := r.URL.Query().Get("event_id")

    userID, err := AuthUserID(r)
    if err != nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    db, _ := DB()
    rows, err := db.Query(`
        SELECT event_id, user_id, beer_id,
               guessed_beer_option_id,
               guessed_abv_range_id,
               guessed_type_id,
               created_at
        FROM guesses
        WHERE event_id = ? AND user_id = ?
    `, eventID, userID)
    if err != nil {
        http.Error(w, "DB error", 500)
        return
    }

    guesses := []Guess{}

    for rows.Next() {
        var g Guess
        var optID, abvID, typeID *int

        rows.Scan(
            &g.EventID,
            &g.UserID,
            &g.BeerID,
            &optID,
            &abvID,
            &typeID,
            &g.CreatedAt,
        )
        g.GuessedBeerOptionID = optID
        g.GuessedABVRangeID = abvID
        g.GuessedTypeID = typeID

        guesses = append(guesses, g)
    }

    json.NewEncoder(w).Encode(guesses)
}
