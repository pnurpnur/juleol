package api

import (
    "encoding/json"
    "net/http"
)

func GetGuess(w http.ResponseWriter, r *http.Request) {
    eventID := r.URL.Query().Get("event_id")
    beerID := r.URL.Query().Get("beer_id")
    userID := r.URL.Query().Get("user_id")

    db, _ := DB()

    row := db.QueryRow(`
        SELECT event_id, user_id, beer_id,
               guessed_beer_option_id,
               guessed_abv_range_id,
               guessed_type_id,
               created_at
        FROM guesses
        WHERE event_id = ? AND beer_id = ? AND user_id = ?
    `, eventID, beerID, userID)

    var g Guess
    var optID, abvID, typeID *int

    err := row.Scan(
        &g.EventID,
        &g.UserID,
        &g.BeerID,
        &optID,
        &abvID,
        &typeID,
        &g.CreatedAt,
    )

    if err != nil {
        http.Error(w, "Guess not found", http.StatusNotFound)
        return
    }

    g.GuessedBeerOptionID = optID
    g.GuessedABVRangeID = abvID
    g.GuessedTypeID = typeID

    json.NewEncoder(w).Encode(g)
}
