package api

import (
    "encoding/json"
    "net/http"
)

func GetRating(w http.ResponseWriter, r *http.Request) {
    eventID := r.URL.Query().Get("event_id")
    beerID := r.URL.Query().Get("beer_id")
    userID := r.URL.Query().Get("user_id")

    db, _ := DB()

    row := db.QueryRow(`
        SELECT event_id, user_id, beer_id,
               rating, untappd_score, created_at
        FROM ratings
        WHERE event_id = ? AND beer_id = ? AND user_id = ?
    `, eventID, beerID, userID)

    var rr Rating
    var up *float64

    err := row.Scan(
        &rr.EventID,
        &rr.UserID,
        &rr.BeerID,
        &rr.Rating,
        &up,
        &rr.CreatedAt,
    )
    if err != nil {
        http.Error(w, "Rating not found", http.StatusNotFound)
        return
    }

    rr.UntappdScore = up

    json.NewEncoder(w).Encode(rr)
}
